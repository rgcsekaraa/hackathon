"""
Tradie context loader — pre-loads business details + availability
into Redis for ultra-fast access during calls.

When a call comes in, the AI needs instant access to:
1. Business name, rates, service area
2. Next available slots
3. Service types (what jobs they handle)

This module loads all of that into a single cached snapshot
that the voice webhook + LangChain can access in ~1ms.
"""

from __future__ import annotations
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.lead import TradieProfile, LeadSession
from services.lead_cache import cache_tradie, get_cached_tradie

logger = logging.getLogger(__name__)


async def load_tradie_context(
    db: AsyncSession,
    tradie_id: Optional[str] = None,
) -> dict:
    """
    Load the tradie's full business context for AI use.

    Returns a dict with:
    - business_name, base_address, service_radius_km
    - hourly_rate, base_callout_fee, markup_pct, travel_rate_per_km
    - service_types (list of job categories they handle)
    - next_available_slots (next 3 open slots)
    - working_hours (weekly schedule)

    If tradie_id is None, loads the first/default tradie.
    Caches result in Redis for 1 hour.
    """

    # Check cache first
    cache_key = tradie_id or "default"
    cached = await get_cached_tradie(cache_key)
    if cached:
        logger.debug("Tradie context cache hit: %s", cache_key)
        return cached

    # Load from DB
    try:
        if tradie_id:
            result = await db.execute(
                select(TradieProfile).where(TradieProfile.id == tradie_id)
            )
        else:
            # Default: load the first tradie (single-tradie MVP)
            result = await db.execute(
                select(TradieProfile).limit(1)
            )

        profile = result.scalar_one_or_none()

        if not profile:
            logger.warning("No tradie profile found (id=%s)", tradie_id)
            return _default_context()

        # Get next available slots
        next_slots = await _get_next_available_slots(db, profile)

        context = {
            "tradie_id": profile.id,
            "business_name": profile.business_name,
            "base_address": profile.base_address,
            "service_radius_km": profile.service_radius_km,

            # Rates
            "hourly_rate": profile.hourly_rate,
            "base_callout_fee": profile.base_callout_fee,
            "markup_pct": profile.markup_pct,
            "min_labour_hours": profile.min_labour_hours,
            "travel_rate_per_km": profile.travel_rate_per_km,

            # What they do
            "service_types": profile.service_types or [
                "tap_repair", "tap_replacement", "toilet_repair",
                "blocked_drain", "hot_water_repair", "leak_repair",
                "pipe_burst", "gas_fitting", "general_plumbing",
            ],

            # Timezone + Availability
            "timezone": profile.timezone or "Australia/Brisbane",
            "working_hours": profile.working_hours or _default_working_hours(),
            "next_available_slots": next_slots,
            "next_available_date": next_slots[0]["date"] if next_slots else None,
            "next_available_time": next_slots[0]["time_slot"] if next_slots else None,

            # For AI personality
            "greeting_name": profile.business_name.split()[0] if profile.business_name else "our plumber",
        }

        # Cache for 1 hour
        await cache_tradie(cache_key, context, ttl=3600)
        logger.info("Loaded tradie context: %s (%s)", profile.business_name, profile.id)

        return context

    except Exception as exc:
        logger.error("Failed to load tradie context: %s", exc)
        return _default_context()


async def _get_next_available_slots(
    db: AsyncSession,
    profile: TradieProfile,
    count: int = 3,
) -> list[dict]:
    """
    Find the next N available time slots for this tradie.

    Checks working hours and excludes already-booked slots.
    """
    # Get existing bookings
    result = await db.execute(
        select(LeadSession).where(
            LeadSession.tradie_id == profile.id,
            LeadSession.status == "booked",
        )
    )
    booked_leads = result.scalars().all()
    booked_set = {
        (l.booked_date, l.booked_time_slot)
        for l in booked_leads
        if l.booked_date and l.booked_time_slot
    }

    day_names = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    working = profile.working_hours or _default_working_hours()

    # Use tradie's timezone for computing "today"
    tz = ZoneInfo(profile.timezone or "Australia/Brisbane")
    now_local = datetime.now(tz)
    today = now_local.date()
    current_time = now_local.strftime("%H:%M")

    slots: list[dict] = []

    # Look up to 14 days ahead
    for i in range(14):
        date = today + timedelta(days=i)
        day_key = day_names[date.weekday()]
        day_slots = working.get(day_key, [])

        for time_slot in day_slots:
            date_str = date.isoformat()

            # Skip past time slots for today
            if i == 0:
                slot_start = time_slot.split("-")[0]  # "08:00-12:00" → "08:00"
                if slot_start <= current_time:
                    continue

            if (date_str, time_slot) not in booked_set:
                # Format for human readability
                day_display = date.strftime("%A %d %B")  # e.g. "Thursday 15 February"
                tz_abbrev = now_local.strftime("%Z")  # e.g. "AEST"
                slots.append({
                    "date": date_str,
                    "time_slot": time_slot,
                    "display": f"{day_display}, {time_slot} {tz_abbrev}",
                    "timezone": str(tz),
                    "is_today": i == 0,
                    "is_tomorrow": i == 1,
                })

                if len(slots) >= count:
                    return slots

    return slots


def get_tradie_context_for_ai(context: dict) -> str:
    """
    Format tradie context as a text block for injection into AI prompts.

    This is what gets prepended to the LangChain classification prompt
    so the AI knows the tradie's details while processing the call.
    """
    slots_text = ""
    for slot in context.get("next_available_slots", []):
        if slot.get("is_today"):
            slots_text += f"  - TODAY: {slot['time_slot']}\n"
        elif slot.get("is_tomorrow"):
            slots_text += f"  - TOMORROW: {slot['time_slot']}\n"
        else:
            slots_text += f"  - {slot['display']}\n"

    if not slots_text:
        slots_text = "  - No slots available in the next 2 weeks\n"

    services = ", ".join(
        s.replace("_", " ") for s in context.get("service_types", [])
    )

    return f"""TRADIE BUSINESS CONTEXT:
Business: {context.get('business_name', 'Local Plumbing')}
Location: {context.get('base_address', 'Gold Coast')}
Service Area: {context.get('service_radius_km', 30)} km radius
Services: {services}
Callout Fee: ${context.get('base_callout_fee', 80):.2f}
Hourly Rate: ${context.get('hourly_rate', 120):.2f}/hr
Next Available Slots:
{slots_text}
IMPORTANT: Use this context when discussing pricing, availability, and scheduling.
Always speak as if you are the receptionist for "{context.get('business_name', 'the business')}".
"""


def _default_working_hours() -> dict:
    """Default Mon-Fri 8-5, Sat 8-12."""
    return {
        "mon": ["08:00-12:00", "13:00-17:00"],
        "tue": ["08:00-12:00", "13:00-17:00"],
        "wed": ["08:00-12:00", "13:00-17:00"],
        "thu": ["08:00-12:00", "13:00-17:00"],
        "fri": ["08:00-12:00", "13:00-17:00"],
        "sat": ["08:00-12:00"],
    }


def _default_context() -> dict:
    """Fallback context when no tradie profile exists."""
    return {
        "tradie_id": None,
        "business_name": "Gold Coast Plumbing",
        "base_address": "Burleigh Heads, QLD",
        "service_radius_km": 30,
        "hourly_rate": 120.0,
        "base_callout_fee": 80.0,
        "markup_pct": 15.0,
        "min_labour_hours": 1.0,
        "travel_rate_per_km": 2.0,
        "service_types": [
            "tap_repair", "tap_replacement", "toilet_repair",
            "blocked_drain", "hot_water_repair", "leak_repair",
            "pipe_burst", "gas_fitting", "general_plumbing",
        ],
        "working_hours": _default_working_hours(),
        "next_available_slots": [
            {"date": "today", "time_slot": "13:00-17:00", "display": "Today, 13:00-17:00", "is_today": True, "is_tomorrow": False},
        ],
        "next_available_date": "today",
        "next_available_time": "13:00-17:00",
        "greeting_name": "Gold Coast Plumbing",
    }
