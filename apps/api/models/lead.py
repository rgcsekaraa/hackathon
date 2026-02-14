"""
Lead pipeline models -- TradieProfile, LeadSession, QuoteLineItem.

These power the Lead-to-Quote-to-Booking pipeline.
"""

from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, DateTime, Float, Integer, Boolean, JSON, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base
import enum


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class LeadStatus(str, enum.Enum):
    """State machine for a lead session."""
    NEW = "new"
    DETAILS_COLLECTED = "details_collected"
    MEDIA_PENDING = "media_pending"
    PRICING = "pricing"
    TRADIE_REVIEW = "tradie_review"
    CONFIRMED = "confirmed"
    BOOKED = "booked"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class UrgencyLevel(str, enum.Enum):
    EMERGENCY = "emergency"
    TODAY = "today"
    TOMORROW = "tomorrow"
    THIS_WEEK = "this_week"
    FLEXIBLE = "flexible"


# ---------------------------------------------------------------------------
# TradieProfile
# ---------------------------------------------------------------------------

class UserProfile(Base):
    """User profile data: rates, services, availability."""
    __tablename__ = "user_profiles"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), unique=True, index=True)

    # Service config
    business_name: Mapped[str] = mapped_column(String, default="")
    service_types: Mapped[dict] = mapped_column(JSON, default=list)  # ["tap_repair", "toilet", "drainage"]
    base_callout_fee: Mapped[float] = mapped_column(Float, default=80.0)
    hourly_rate: Mapped[float] = mapped_column(Float, default=95.0)
    markup_pct: Mapped[float] = mapped_column(Float, default=15.0)  # % markup on parts
    min_labour_hours: Mapped[float] = mapped_column(Float, default=1.0)

    # Location
    base_address: Mapped[str] = mapped_column(String, default="")
    base_lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    base_lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    service_radius_km: Mapped[float] = mapped_column(Float, default=30.0)
    travel_rate_per_km: Mapped[float] = mapped_column(Float, default=1.50)

    # Timezone (IANA format, e.g. 'Australia/Brisbane')
    # Used for timezone-aware scheduling — ensures slots are in the tradie's local time
    timezone: Mapped[str] = mapped_column(String, default="Australia/Brisbane")

    # Availability (JSON: {"mon": ["08:00-17:00"], "tue": [...], ...})
    working_hours: Mapped[dict] = mapped_column(JSON, default=dict)

    # Meta
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relations
    user: Mapped["User"] = relationship(back_populates="user_profile")
    leads: Mapped[list["LeadSession"]] = relationship(back_populates="user_profile", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"UserProfile(id={self.id!r}, business={self.business_name!r})"


# ---------------------------------------------------------------------------
# LeadSession
# ---------------------------------------------------------------------------

class LeadSession(Base):
    """A single inbound lead flowing through the pipeline."""
    __tablename__ = "lead_sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_profile_id: Mapped[str] = mapped_column(String, ForeignKey("user_profiles.id"), index=True)

    # State machine
    status: Mapped[str] = mapped_column(String, default=LeadStatus.NEW.value)

    # Customer info
    customer_name: Mapped[str] = mapped_column(String, default="")
    customer_phone: Mapped[str] = mapped_column(String, default="")
    customer_address: Mapped[str] = mapped_column(String, default="")
    customer_lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    customer_lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Job details
    job_type: Mapped[str] = mapped_column(String, default="")  # e.g. "tap_repair"
    job_description: Mapped[str] = mapped_column(Text, default="")
    urgency: Mapped[str] = mapped_column(String, default=UrgencyLevel.FLEXIBLE.value)

    # Media
    photo_urls: Mapped[dict] = mapped_column(JSON, default=list)  # list of URLs
    photo_analysis: Mapped[dict] = mapped_column(JSON, default=dict)  # Vision API results

    # Pricing (snapshot once calculated)
    quote_snapshot: Mapped[dict] = mapped_column(JSON, default=dict)
    quote_total: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Distance
    distance_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    travel_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Tradie decision
    tradie_decision: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # approve/reject/edit
    tradie_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tradie_edited_quote: Mapped[dict] = mapped_column(JSON, default=dict)

    # Booking
    booked_date: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    booked_time_slot: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    booked_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Conversation history (for AI context)
    conversation: Mapped[dict] = mapped_column(JSON, default=list)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relations
    user_profile: Mapped["UserProfile"] = relationship(back_populates="leads")
    line_items: Mapped[list["QuoteLineItem"]] = relationship(back_populates="lead", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"LeadSession(id={self.id!r}, status={self.status!r})"


# ---------------------------------------------------------------------------
# QuoteLineItem
# ---------------------------------------------------------------------------

class QuoteLineItem(Base):
    """Individual line item in a quote."""
    __tablename__ = "quote_line_items"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    lead_id: Mapped[str] = mapped_column(String, ForeignKey("lead_sessions.id"), index=True)

    category: Mapped[str] = mapped_column(String)  # callout, labour, parts, travel, gst
    label: Mapped[str] = mapped_column(String)  # Human-readable label
    quantity: Mapped[float] = mapped_column(Float, default=1.0)
    unit_price: Mapped[float] = mapped_column(Float, default=0.0)
    total: Mapped[float] = mapped_column(Float, default=0.0)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relations
    lead: Mapped["LeadSession"] = relationship(back_populates="line_items")

    def __repr__(self) -> str:
        return f"QuoteLineItem(id={self.id!r}, category={self.category!r}, total={self.total})"
