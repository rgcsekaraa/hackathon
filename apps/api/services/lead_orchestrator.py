"""
Lead Orchestrator — the central brain of the pipeline.

Manages lead session lifecycle:
1. Receives customer utterance/input
2. Uses LLM to classify job type, address, urgency
3. Triggers parallel integration calls (distance, pricing, vision)
4. Assembles quote via Quote Engine
5. Pushes lead card to tradie for approval
6. Handles tradie decision → confirms with customer → books
"""

from __future__ import annotations
import asyncio
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.lead import UserProfile, LeadSession, QuoteLineItem, LeadStatus
from schemas.lead import (
    LeadCreate, LeadResponse, TradieDecision, TradieDecisionEnum,
    QuoteBreakdown, QuoteLineItemSchema, PhotoAnalysis,
    LeadPatch, CustomerMessage,
)
from services.quote_engine import calculate_quote, estimate_labour_hours
from services.integrations.vision import analyse_image
from services.integrations.distance import calculate_distance
from services.integrations.pricing import lookup_parts_price
from services.integrations.sms import send_photo_upload_link, send_booking_confirmation
from core.config import settings

logger = logging.getLogger(__name__)

# LLM prompt for lead classification
CLASSIFY_LEAD_PROMPT = """You are an AI assistant for a plumbing service.
Analyse the customer's message and extract:
1. job_type: one of [tap_repair, tap_replacement, toilet_repair, toilet_replacement, blocked_drain, hot_water_repair, hot_water_replacement, leak_repair, pipe_burst, gas_fitting, general_plumbing]
2. address: the customer's address or suburb (if mentioned)
3. urgency: one of [emergency, today, tomorrow, this_week, flexible]
4. description: a brief summary of the issue

Respond in JSON only: {"job_type": "...", "address": "...", "urgency": "...", "description": "..."}

Customer message: "{text}"
"""


async def classify_lead_text(text: str) -> dict:
    """Use LLM to classify customer text into job details."""
    try:
        import httpx

        if not settings.openrouter_api_key:
            return _fallback_classify(text)

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{settings.openrouter_base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openrouter_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.openrouter_model,
                    "messages": [
                        {"role": "system", "content": "You are a helpful assistant that extracts structured data from customer messages."},
                        {"role": "user", "content": CLASSIFY_LEAD_PROMPT.format(text=text)},
                    ],
                    "temperature": 0.1,
                    "max_tokens": 200,
                },
                timeout=15.0,
            )
            resp.raise_for_status()
            data = resp.json()

        content = data["choices"][0]["message"]["content"]
        # Parse JSON from response (handle potential markdown wrapping)
        content = content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1].rsplit("```", 1)[0]
        return json.loads(content)

    except Exception as e:
        logger.error("LLM classification error: %s -- using fallback", e)
        return _fallback_classify(text)


def _fallback_classify(text: str) -> dict:
    """Keyword-based fallback classification."""
    text_lower = text.lower()
    result = {
        "job_type": "general_plumbing",
        "address": "",
        "urgency": "flexible",
        "description": text,
    }

    # Job type detection
    if any(w in text_lower for w in ["tap", "faucet", "mixer"]):
        result["job_type"] = "tap_repair" if "fix" in text_lower or "leak" in text_lower or "repair" in text_lower else "tap_replacement"
    elif any(w in text_lower for w in ["toilet", "loo", "dunny"]):
        result["job_type"] = "toilet_repair"
    elif any(w in text_lower for w in ["drain", "blocked", "clog"]):
        result["job_type"] = "blocked_drain"
    elif any(w in text_lower for w in ["hot water", "heater"]):
        result["job_type"] = "hot_water_repair"
    elif any(w in text_lower for w in ["leak", "drip"]):
        result["job_type"] = "leak_repair"
    elif any(w in text_lower for w in ["pipe", "burst"]):
        result["job_type"] = "pipe_burst"

    # Urgency
    if any(w in text_lower for w in ["urgent", "emergency", "asap", "now"]):
        result["urgency"] = "emergency"
    elif "today" in text_lower:
        result["urgency"] = "today"
    elif "tomorrow" in text_lower:
        result["urgency"] = "tomorrow"

    # Address extraction (look for suburb names)
    suburbs = [
        "burleigh heads", "surfers paradise", "broadbeach", "robina",
        "nerang", "southport", "coolangatta", "palm beach", "mermaid beach",
        "miami", "varsity lakes", "mudgeeraba", "ormeau", "coomera", "helensvale",
    ]
    for suburb in suburbs:
        if suburb in text_lower:
            result["address"] = suburb.title()
            break

    return result


# ---------------------------------------------------------------------------
# Lead Lifecycle
# ---------------------------------------------------------------------------

async def create_lead(
    db: AsyncSession,
    user_profile_id: str,
    lead_data: LeadCreate,
) -> LeadSession:
    """Create a new lead session."""
    lead = LeadSession(
        id=str(uuid.uuid4()),
        user_profile_id=user_profile_id,
        status=LeadStatus.NEW.value,
        customer_name=lead_data.customer_name,
        customer_phone=lead_data.customer_phone,
        customer_address=lead_data.customer_address,
        job_description=lead_data.job_description,
        urgency=lead_data.urgency.value,
        conversation=[{
            "role": "customer",
            "text": lead_data.job_description,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }],
    )
    db.add(lead)
    await db.flush()
    return lead


async def process_customer_message(
    db: AsyncSession,
    lead: LeadSession,
    message: str,
) -> list[LeadPatch]:
    """
    Process a customer message through the pipeline.

    Returns a list of patches to broadcast over WebSocket.
    """
    patches: list[LeadPatch] = []

    # Add to conversation history
    lead.conversation = lead.conversation + [{
        "role": "customer",
        "text": message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }]

    # Step 1: Classify with AI
    patches.append(LeadPatch(
        type="step_changed",
        lead_id=lead.id,
        data={"step": "classifying", "message": "Understanding your request..."},
    ))

    classification = await classify_lead_text(message)

    if classification.get("job_type"):
        lead.job_type = classification["job_type"]
    if classification.get("address"):
        lead.customer_address = classification["address"]
    if classification.get("urgency"):
        lead.urgency = classification["urgency"]
    if classification.get("description"):
        lead.job_description = classification["description"]

    lead.status = LeadStatus.DETAILS_COLLECTED.value

    patches.append(LeadPatch(
        type="lead_update",
        lead_id=lead.id,
        data={
            "status": lead.status,
            "job_type": lead.job_type,
            "customer_address": lead.customer_address,
            "urgency": lead.urgency,
            "job_description": lead.job_description,
        },
        message=f"Got it — looks like a {lead.job_type.replace('_', ' ')} job in {lead.customer_address or 'your area'}.",
    ))

    # Step 2: Offer photo upload
    if lead.customer_phone:
        patches.append(LeadPatch(
            type="step_changed",
            lead_id=lead.id,
            data={"step": "photo_offer", "message": "Would you like to send photos for a more accurate quote?"},
        ))
        await send_photo_upload_link(lead.customer_phone, lead.id)
        lead.status = LeadStatus.MEDIA_PENDING.value

    # Step 3: Calculate distance + pricing in parallel
    patches.append(LeadPatch(
        type="step_changed",
        lead_id=lead.id,
        data={"step": "pricing", "message": "Calculating your estimate..."},
    ))
    lead.status = LeadStatus.PRICING.value

    # Get user profile for rates
    result = await db.execute(
        select(UserProfile).where(UserProfile.id == lead.user_profile_id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        logger.error("User profile not found: %s", lead.user_profile_id)
        return patches

    # Parallel integration calls
    distance_task = calculate_distance(profile.base_address, lead.customer_address)

    # If we have a photo analysis, use it for parts lookup
    parts_price = 0.0
    sku_class = None
    if lead.photo_analysis and lead.photo_analysis.get("suggested_sku_class"):
        sku_class = lead.photo_analysis["suggested_sku_class"]
    else:
        # Guess parts from job type
        from services.integrations.pricing import PARTS_CATALOGUE
        job_to_sku = {
            "tap_repair": "tap_washer_kit",
            "tap_replacement": "mixer_tap_15mm",
            "toilet_repair": "cistern_valve_standard",
            "blocked_drain": "drain_snake_standard",
            "hot_water_repair": "hw_thermostat",
            "leak_repair": "pipe_repair_clamp",
            "pipe_burst": "pipe_repair_clamp",
        }
        sku_class = job_to_sku.get(lead.job_type)

    parts_result = await lookup_parts_price(sku_class)
    if parts_result:
        parts_price = parts_result.price

    distance_result = await distance_task

    lead.distance_km = distance_result.distance_km
    lead.travel_minutes = distance_result.duration_minutes

    patches.append(LeadPatch(
        type="step_changed",
        lead_id=lead.id,
        data={
            "step": "distance_calculated",
            "distance_km": distance_result.distance_km,
            "travel_minutes": distance_result.duration_minutes,
            "message": f"Travel: {distance_result.distance_km} km (~{distance_result.duration_minutes} min)",
        },
    ))

    # Step 4: Build quote
    estimated_hours = estimate_labour_hours(lead.job_type)

    quote = calculate_quote(
        callout_fee=profile.base_callout_fee,
        hourly_rate=profile.hourly_rate,
        min_labour_hours=profile.min_labour_hours,
        estimated_hours=estimated_hours,
        parts_cost=parts_price,
        markup_pct=profile.markup_pct,
        distance_km=distance_result.distance_km,
        travel_rate_per_km=profile.travel_rate_per_km,
    )

    # Save quote to lead
    lead.quote_snapshot = quote.model_dump()
    lead.quote_total = quote.total

    # Save line items to DB
    for item in quote.line_items:
        db_item = QuoteLineItem(
            id=str(uuid.uuid4()),
            lead_id=lead.id,
            category=item.category,
            label=item.label,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total=item.total,
            notes=item.notes,
        )
        db.add(db_item)

    # Step 5: Send to tradie for review
    lead.status = LeadStatus.TRADIE_REVIEW.value

    patches.append(LeadPatch(
        type="quote_ready",
        lead_id=lead.id,
        data={
            "status": lead.status,
            "quote": quote.model_dump(),
            "distance_km": distance_result.distance_km,
            "travel_minutes": distance_result.duration_minutes,
            "parts_info": parts_result.to_dict() if parts_result else None,
        },
        message=f"Quote ready: ${quote.total:.2f} incl. GST. Waiting for tradie approval.",
    ))

    # Add AI response to conversation
    lead.conversation = lead.conversation + [{
        "role": "assistant",
        "text": f"Based on the details, the estimated quote is ${quote.total:.2f} (incl. GST). The tradie will review and confirm shortly.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }]

    return patches


async def handle_tradie_decision(
    db: AsyncSession,
    lead: LeadSession,
    decision: TradieDecision,
) -> list[LeadPatch]:
    """Process tradie's approve/edit/reject decision."""
    patches: list[LeadPatch] = []

    lead.tradie_decision = decision.decision.value
    lead.tradie_notes = decision.notes

    if decision.decision == TradieDecisionEnum.APPROVE:
        lead.status = LeadStatus.CONFIRMED.value

        # Book if date/time provided
        if decision.booked_date and decision.booked_time_slot:
            lead.booked_date = decision.booked_date
            lead.booked_time_slot = decision.booked_time_slot
            lead.booked_at = datetime.now(timezone.utc)
            lead.status = LeadStatus.BOOKED.value

            # Send confirmation SMS
            if lead.customer_phone:
                await send_booking_confirmation(
                    lead.customer_phone,
                    decision.booked_date,
                    decision.booked_time_slot,
                    lead.quote_total or 0,
                )

        patches.append(LeadPatch(
            type="booking_confirmed",
            lead_id=lead.id,
            data={
                "status": lead.status,
                "booked_date": lead.booked_date,
                "booked_time_slot": lead.booked_time_slot,
                "quote_total": lead.quote_total,
            },
            message=f"Booking confirmed for {lead.booked_date} at {lead.booked_time_slot}!",
        ))

    elif decision.decision == TradieDecisionEnum.EDIT:
        # Tradie edited the quote
        if decision.edited_quote:
            lead.tradie_edited_quote = decision.edited_quote.model_dump()
            lead.quote_total = decision.edited_quote.total
        lead.status = LeadStatus.TRADIE_REVIEW.value

        patches.append(LeadPatch(
            type="quote_updated",
            lead_id=lead.id,
            data={
                "status": lead.status,
                "quote": lead.tradie_edited_quote or lead.quote_snapshot,
                "quote_total": lead.quote_total,
            },
            message="Quote updated by tradie.",
        ))

    elif decision.decision == TradieDecisionEnum.REJECT:
        lead.status = LeadStatus.REJECTED.value

        patches.append(LeadPatch(
            type="lead_rejected",
            lead_id=lead.id,
            data={"status": lead.status, "notes": decision.notes},
            message="Unfortunately, the tradie is unable to take this job at this time.",
        ))

    return patches


async def process_photo(
    db: AsyncSession,
    lead: LeadSession,
    image_url: str | None = None,
    image_bytes: bytes | None = None,
) -> list[LeadPatch]:
    """Process an uploaded photo through Vision API."""
    patches: list[LeadPatch] = []

    patches.append(LeadPatch(
        type="step_changed",
        lead_id=lead.id,
        data={"step": "analysing_photo", "message": "Analysing your photo..."},
    ))

    analysis = await analyse_image(image_url=image_url, image_bytes=image_bytes)

    # Store results
    if image_url:
        lead.photo_urls = lead.photo_urls + [image_url]
    lead.photo_analysis = analysis.model_dump()

    patches.append(LeadPatch(
        type="photo_analysed",
        lead_id=lead.id,
        data={
            "analysis": analysis.model_dump(),
            "detected_part": analysis.detected_part,
            "confidence": analysis.confidence,
        },
        message=f"Photo analysed: detected {analysis.detected_part or 'plumbing fixture'} (confidence: {analysis.confidence:.0%})",
    ))

    return patches
