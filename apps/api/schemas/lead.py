"""
Pydantic schemas for the Lead-to-Quote-to-Booking pipeline.
"""

from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class LeadStatusEnum(str, Enum):
    NEW = "new"
    DETAILS_COLLECTED = "details_collected"
    MEDIA_PENDING = "media_pending"
    PRICING = "pricing"
    TRADIE_REVIEW = "tradie_review"
    CONFIRMED = "confirmed"
    BOOKED = "booked"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class UrgencyEnum(str, Enum):
    EMERGENCY = "emergency"
    TODAY = "today"
    TOMORROW = "tomorrow"
    THIS_WEEK = "this_week"
    FLEXIBLE = "flexible"


class TradieDecisionEnum(str, Enum):
    APPROVE = "approve"
    EDIT = "edit"
    REJECT = "reject"


# ---------------------------------------------------------------------------
# User Profile
# ---------------------------------------------------------------------------

class UserProfileCreate(BaseModel):
    business_name: str = ""
    service_types: list[str] = Field(default_factory=list)
    base_callout_fee: float = 80.0
    hourly_rate: float = 95.0
    markup_pct: float = 15.0
    min_labour_hours: float = 1.0
    base_address: str = ""
    service_radius_km: float = 30.0
    travel_rate_per_km: float = 1.50
    timezone: str = "Australia/Brisbane"  # IANA timezone
    working_hours: dict[str, list[str]] = Field(default_factory=dict)
    inbound_config: dict = Field(default_factory=dict)


class UserProfileResponse(BaseModel):
    id: str
    user_id: str
    business_name: str
    service_types: list[str]
    base_callout_fee: float
    hourly_rate: float
    markup_pct: float
    min_labour_hours: float
    base_address: str
    service_radius_km: float
    travel_rate_per_km: float
    timezone: str
    working_hours: dict[str, list[str]]
    inbound_config: dict
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Quote
# ---------------------------------------------------------------------------

class QuoteLineItemSchema(BaseModel):
    category: str  # callout, labour, parts, travel, gst
    label: str
    quantity: float = 1.0
    unit_price: float = 0.0
    total: float = 0.0
    notes: Optional[str] = None


class QuoteBreakdown(BaseModel):
    line_items: list[QuoteLineItemSchema] = Field(default_factory=list)
    subtotal: float = 0.0
    gst: float = 0.0
    total: float = 0.0
    currency: str = "AUD"


# ---------------------------------------------------------------------------
# Lead Session
# ---------------------------------------------------------------------------

class LeadCreate(BaseModel):
    """Customer initiates a new lead (from simulated call)."""
    customer_name: str = ""
    customer_phone: str = ""
    customer_address: str = ""
    job_description: str = ""
    urgency: UrgencyEnum = UrgencyEnum.FLEXIBLE


class LeadUpdate(BaseModel):
    """Partial updates pushed during the pipeline."""
    status: Optional[LeadStatusEnum] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    job_type: Optional[str] = None
    job_description: Optional[str] = None
    urgency: Optional[UrgencyEnum] = None
    photo_urls: Optional[list[str]] = None


class LeadResponse(BaseModel):
    id: str
    user_profile_id: str
    status: LeadStatusEnum
    customer_name: str
    customer_phone: str
    customer_address: str
    job_type: str
    job_description: str
    urgency: UrgencyEnum
    photo_urls: list[str]
    photo_analysis: dict
    quote_snapshot: dict
    quote_total: Optional[float]
    distance_km: Optional[float]
    travel_minutes: Optional[int]
    tradie_decision: Optional[str]
    tradie_notes: Optional[str]
    booked_date: Optional[str]
    booked_time_slot: Optional[str]
    conversation: list[dict]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Tradie Decision
# ---------------------------------------------------------------------------

class TradieDecision(BaseModel):
    """Tradie approves, edits, or rejects a lead."""
    decision: TradieDecisionEnum
    notes: Optional[str] = None
    edited_quote: Optional[QuoteBreakdown] = None
    booked_date: Optional[str] = None
    booked_time_slot: Optional[str] = None


# ---------------------------------------------------------------------------
# Photo Analysis
# ---------------------------------------------------------------------------

class PhotoAnalysis(BaseModel):
    labels: list[str] = Field(default_factory=list)
    detected_objects: list[str] = Field(default_factory=list)
    detected_part: Optional[str] = None
    confidence: float = 0.0
    suggested_sku_class: Optional[str] = None  # e.g. "mixer_tap_15mm"


# ---------------------------------------------------------------------------
# Customer message (voice/text input)
# ---------------------------------------------------------------------------

class CustomerMessage(BaseModel):
    """A message from the customer in the guided conversation."""
    text: str
    lead_id: Optional[str] = None


# ---------------------------------------------------------------------------
# WebSocket patch types
# ---------------------------------------------------------------------------

class LeadPatch(BaseModel):
    """A realtime update pushed over WebSocket."""
    type: str  # lead_update, quote_ready, tradie_decision, booking_confirmed, step_changed, status
    lead_id: str
    data: dict = Field(default_factory=dict)
    message: Optional[str] = None
    timestamp: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Schedule
# ---------------------------------------------------------------------------

class ScheduleSlot(BaseModel):
    date: str  # YYYY-MM-DD
    time_slot: str  # e.g. "08:00-10:00"
    available: bool = True
    timezone: str = "Australia/Brisbane"  # IANA timezone


class ScheduleResponse(BaseModel):
    slots: list[ScheduleSlot] = Field(default_factory=list)
    timezone: str = "Australia/Brisbane"  # Tradie's timezone
