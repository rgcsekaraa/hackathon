"""
Lead management API routes.

Handles lead CRUD, photo uploads, and tradie decisions.
"""

from __future__ import annotations
import base64
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from core.deps import get_current_user
from models.user import User
from models.lead import LeadSession, UserProfile, LeadStatus
from schemas.lead import (
    LeadCreate, LeadResponse, TradieDecision,
    CustomerMessage, LeadPatch,
)
from services.lead_orchestrator import (
    create_lead,
    process_customer_message,
    handle_tradie_decision,
    process_photo,
    enqueue_lead_processing,
    enqueue_photo_processing,
)
from services.realtime.connection_manager import lead_manager

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/leads", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
async def create_new_lead(
    data: LeadCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Create a new lead session (simulated inbound call)."""
    # Find user profile -- for demo, use the current user's profile
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user.id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(
            status_code=400,
            detail="You need to set up your profile first.",
        )

    lead = await create_lead(db, profile.id, data)
    lead.status = LeadStatus.DETAILS_COLLECTED.value
    queued = await enqueue_lead_processing(lead.id, data.job_description, source="api.create_lead")
    if not queued:
        # Redis queue unavailable -> sync fallback
        await process_customer_message(db, lead, data.job_description)

    await db.commit()
    await db.refresh(lead)

    # Broadcast new lead to all connected tradie clients
    await lead_manager.broadcast_new_lead({
        "id": lead.id,
        "customerName": lead.customer_name,
        "customerPhone": lead.customer_phone,
        "address": lead.customer_address or "",
        "suburb": "",
        "urgency": lead.urgency or "standard",
        "status": lead.status,
        "jobType": lead.job_type or "",
        "description": lead.job_description or "",
        "quoteTotal": lead.quote_total,
        "pipeline_status": "queued" if queued else "processed",
        "createdAt": lead.created_at.isoformat() if lead.created_at else "",
    })

    return lead


@router.get("/leads", response_model=list[LeadResponse])
async def list_leads(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List all leads for the current user."""
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        return []

    result = await db.execute(
        select(LeadSession)
        .where(LeadSession.user_profile_id == profile.id)
        .order_by(LeadSession.created_at.desc())
    )
    return result.scalars().all()


@router.get("/leads/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a lead by ID (public for customer access)."""
    result = await db.execute(
        select(LeadSession).where(LeadSession.id == lead_id)
    )
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.post("/leads/{lead_id}/message", response_model=list[LeadPatch])
async def send_customer_message(
    lead_id: str,
    message: CustomerMessage,
    db: AsyncSession = Depends(get_db),
):
    """Customer sends a message in the guided conversation."""
    result = await db.execute(
        select(LeadSession).where(LeadSession.id == lead_id)
    )
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    queued = await enqueue_lead_processing(lead.id, message.text, source="api.customer_message")
    if queued:
        lead.status = LeadStatus.DETAILS_COLLECTED.value
        patches = [
            LeadPatch(
                type="step_changed",
                lead_id=lead.id,
                data={"step": "queued", "message": "Queued for background analysis."},
                message="Queued for realtime enrichment.",
            )
        ]
    else:
        patches = await process_customer_message(db, lead, message.text)
    await db.commit()

    # Broadcast message update
    await lead_manager.broadcast_lead_update({
        "id": lead.id,
        "status": lead.status,
        "pipeline_status": "queued" if queued else "processed",
        "jobType": lead.job_type, "urgency": lead.urgency,
    })
    return patches


@router.post("/leads/{lead_id}/photo", response_model=list[LeadPatch])
async def upload_photo(
    lead_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Customer uploads a photo for analysis."""
    result = await db.execute(
        select(LeadSession).where(LeadSession.id == lead_id)
    )
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    image_bytes = await file.read()
    image_b64 = base64.b64encode(image_bytes).decode("ascii")
    queued = await enqueue_photo_processing(
        lead.id,
        image_b64=image_b64,
        mime_type=file.content_type or "image/jpeg",
        source="api.leads.photo",
    )
    if queued:
        patches = [
            LeadPatch(
                type="step_changed",
                lead_id=lead.id,
                data={"step": "photo_received", "message": "Photo received and queued for analysis."},
                message="Photo queued for analysis.",
            )
        ]
    else:
        try:
            patches = await process_photo(db, lead, image_bytes=image_bytes)
        except Exception as exc:
            logger.error("Lead photo analysis failed for %s: %s", lead_id, exc, exc_info=True)
            await lead_manager.broadcast_lead_update({
                "id": lead.id,
                "status": "analysis_failed",
                "error": str(exc),
            })
            raise HTTPException(status_code=503, detail=f"Photo analysis failed: {exc}")
    await db.commit()

    # Broadcast photo analysis → trigger quote recalculation on mobile
    await lead_manager.broadcast_lead_update({
        "id": lead.id,
        "status": "photo_received" if queued else lead.status,
        "pipeline_status": "queued" if queued else "processed",
        "photoAnalysis": lead.photo_analysis,
    })
    return patches


@router.patch("/leads/{lead_id}/decision", response_model=list[LeadPatch])
async def submit_tradie_decision(
    lead_id: str,
    decision: TradieDecision,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Tradie approves, edits, or rejects a lead."""
    result = await db.execute(
        select(LeadSession).where(LeadSession.id == lead_id)
    )
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Verify user owns this lead
    result = await db.execute(
        select(UserProfile).where(
            UserProfile.id == lead.user_profile_id,
            UserProfile.user_id == user.id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not your lead")

    patches = await handle_tradie_decision(db, lead, decision)
    await db.commit()

    # Broadcast decision to all connected clients
    decision_str = decision.action if hasattr(decision, 'action') else str(decision)
    await lead_manager.broadcast_lead_decided(lead.id, decision_str, user.id)
    return patches
