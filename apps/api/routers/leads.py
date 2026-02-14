"""
Lead management API routes.

Handles lead CRUD, photo uploads, and tradie decisions.
"""

from __future__ import annotations
import logging
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from core.deps import get_current_user
from models.user import User
from models.lead import LeadSession, TradieProfile, LeadStatus
from schemas.lead import (
    LeadCreate, LeadResponse, LeadUpdate, TradieDecision,
    CustomerMessage, LeadPatch,
)
from services.lead_orchestrator import (
    create_lead, process_customer_message,
    handle_tradie_decision, process_photo,
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
    # Find tradie profile -- for demo, use the current user's profile
    result = await db.execute(
        select(TradieProfile).where(TradieProfile.user_id == user.id)
    )
    tradie = result.scalar_one_or_none()

    if not tradie:
        raise HTTPException(
            status_code=400,
            detail="You need to set up your tradie profile first.",
        )

    lead = await create_lead(db, tradie.id, data)

    # Process the initial message through the pipeline
    patches = await process_customer_message(db, lead, data.job_description)

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
        "createdAt": lead.created_at.isoformat() if lead.created_at else "",
    })

    return lead


@router.get("/leads", response_model=list[LeadResponse])
async def list_leads(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List all leads for the current tradie."""
    result = await db.execute(
        select(TradieProfile).where(TradieProfile.user_id == user.id)
    )
    tradie = result.scalar_one_or_none()
    if not tradie:
        return []

    result = await db.execute(
        select(LeadSession)
        .where(LeadSession.tradie_id == tradie.id)
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

    patches = await process_customer_message(db, lead, message.text)
    await db.commit()

    # Broadcast message update
    await lead_manager.broadcast_lead_update({
        "id": lead.id, "status": lead.status,
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
    patches = await process_photo(db, lead, image_bytes=image_bytes)
    await db.commit()

    # Broadcast photo analysis → trigger quote recalculation on mobile
    await lead_manager.broadcast_lead_update({
        "id": lead.id, "status": lead.status,
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

    # Verify tradie owns this lead
    result = await db.execute(
        select(TradieProfile).where(
            TradieProfile.id == lead.tradie_id,
            TradieProfile.user_id == user.id,
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
