"""
Tradie profile and schedule management routes.
"""

from __future__ import annotations
import logging
import uuid
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from core.deps import get_current_user
from models.user import User
from models.lead import TradieProfile, LeadSession
from schemas.lead import (
    TradieProfileCreate, TradieProfileResponse,
    ScheduleSlot, ScheduleResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/tradie/profile", response_model=TradieProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_or_update_profile(
    data: TradieProfileCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Create or update the tradie's profile (onboarding)."""
    result = await db.execute(
        select(TradieProfile).where(TradieProfile.user_id == user.id)
    )
    profile = result.scalar_one_or_none()

    if profile:
        # Update existing
        profile.business_name = data.business_name
        profile.service_types = data.service_types
        profile.base_callout_fee = data.base_callout_fee
        profile.hourly_rate = data.hourly_rate
        profile.markup_pct = data.markup_pct
        profile.min_labour_hours = data.min_labour_hours
        profile.base_address = data.base_address
        profile.service_radius_km = data.service_radius_km
        profile.travel_rate_per_km = data.travel_rate_per_km
        profile.timezone = data.timezone
        profile.working_hours = data.working_hours
    else:
        # Create new
        profile = TradieProfile(
            id=str(uuid.uuid4()),
            user_id=user.id,
            business_name=data.business_name,
            service_types=data.service_types,
            base_callout_fee=data.base_callout_fee,
            hourly_rate=data.hourly_rate,
            markup_pct=data.markup_pct,
            min_labour_hours=data.min_labour_hours,
            base_address=data.base_address,
            service_radius_km=data.service_radius_km,
            travel_rate_per_km=data.travel_rate_per_km,
            timezone=data.timezone,
            working_hours=data.working_hours,
        )
        db.add(profile)

    await db.commit()
    await db.refresh(profile)
    return profile


@router.get("/tradie/profile", response_model=TradieProfileResponse | None)
async def get_profile(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get the tradie's profile."""
    result = await db.execute(
        select(TradieProfile).where(TradieProfile.user_id == user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        return None
    return profile


@router.get("/tradie/schedule", response_model=ScheduleResponse)
async def get_schedule(
    days: int = 7,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Get available schedule slots for the next N days.

    Uses working hours from the tradie profile and blocks out already-booked slots.
    """
    result = await db.execute(
        select(TradieProfile).where(TradieProfile.user_id == user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=400, detail="Set up your tradie profile first")

    # Get existing bookings
    result = await db.execute(
        select(LeadSession).where(
            LeadSession.tradie_id == profile.id,
            LeadSession.status == "booked",
        )
    )
    booked_leads = result.scalars().all()
    booked_slots = {(l.booked_date, l.booked_time_slot) for l in booked_leads if l.booked_date}

    # Build available slots (timezone-aware)
    day_names = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    default_hours = {
        "mon": ["08:00-12:00", "13:00-17:00"],
        "tue": ["08:00-12:00", "13:00-17:00"],
        "wed": ["08:00-12:00", "13:00-17:00"],
        "thu": ["08:00-12:00", "13:00-17:00"],
        "fri": ["08:00-12:00", "13:00-17:00"],
        "sat": ["08:00-12:00"],
    }
    working = profile.working_hours if profile.working_hours else default_hours

    # Use tradie's timezone for "today" computation
    tz = ZoneInfo(profile.timezone or "Australia/Brisbane")
    now_local = datetime.now(tz)
    today = now_local.date()
    current_time = now_local.strftime("%H:%M")

    slots: list[ScheduleSlot] = []

    for i in range(days):
        date = today + timedelta(days=i)
        day_key = day_names[date.weekday()]
        day_slots = working.get(day_key, [])

        for time_slot in day_slots:
            # Skip past time slots for today
            if i == 0:
                slot_start = time_slot.split("-")[0]
                if slot_start <= current_time:
                    continue

            is_booked = (date.isoformat(), time_slot) in booked_slots
            slots.append(ScheduleSlot(
                date=date.isoformat(),
                time_slot=time_slot,
                available=not is_booked,
                timezone=profile.timezone or "Australia/Brisbane",
            ))

    return ScheduleResponse(
        slots=slots,
        timezone=profile.timezone or "Australia/Brisbane",
    )
