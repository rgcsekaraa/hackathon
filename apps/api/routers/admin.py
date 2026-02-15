from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
import logging

from db.session import get_db
from models.user import User
from models.lead import UserProfile
from schemas.auth import UserCreate
from schemas.lead import UserProfileCreate, UserProfileResponse
from core.auth import get_password_hash
from core.deps import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/profiles", response_model=list[UserProfileResponse])
async def get_all_profiles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch all onboarded customer profiles (Admin Only)."""
    if current_user.role != "admin" and current_user.email != "superadmin@sophiie.com":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    result = await db.execute(select(UserProfile))
    return result.scalars().all()

@router.post("/onboard", response_model=UserProfileResponse)
async def onboard_customer(
    user_in: UserCreate,
    profile_in: UserProfileCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Unified onboarding: Create user and their business profile."""
    if current_user.role != "admin" and current_user.email != "superadmin@sophiie.com":
        raise HTTPException(status_code=403, detail="Not authorized")

    # 1. Check if user already exists
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User already exists")

    # 2. Create User
    new_user = User(
        id=str(uuid.uuid4()),
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        is_verified=True,
        role="member"
    )
    db.add(new_user)
    
    # 3. Create Profile
    new_profile = UserProfile(
        id=str(uuid.uuid4()),
        user_id=new_user.id,
        business_name=profile_in.business_name,
        service_types=profile_in.service_types,
        base_callout_fee=profile_in.base_callout_fee,
        hourly_rate=profile_in.hourly_rate,
        timezone=profile_in.timezone,
        working_hours=profile_in.working_hours
    )
    db.add(new_profile)
    
    await db.commit()
    await db.refresh(new_profile)
    return new_profile

@router.get("/stats")
async def get_admin_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch global reports for the Super-Admin dashboard."""
    if current_user.role != "admin" and current_user.email != "superadmin@sophiie.com":
        raise HTTPException(status_code=403, detail="Not authorized")

    from sqlalchemy import func
    from models.lead import LeadSession
    
    # Simple aggregation for now
    customer_count = await db.scalar(select(func.count(UserProfile.id)))
    total_leads = await db.scalar(select(func.count(LeadSession.id)))
    booked_leads = await db.scalar(select(func.count(LeadSession.id)).where(LeadSession.status == "booked"))
    
    return {
        "total_customers": customer_count or 0,
        "total_leads": total_leads or 0,
        "booking_rate": (booked_leads / total_leads * 100) if total_leads and total_leads > 0 else 0,
        "active_portals": customer_count or 0
    }

@router.patch("/profiles/{profile_id}", response_model=UserProfileResponse)
async def update_customer_profile(
    profile_id: str,
    update_data: UserProfileCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update specific customer settings (Admin Only)."""
    if current_user.role != "admin" and current_user.email != "superadmin@sophiie.com":
        raise HTTPException(status_code=403, detail="Not authorized")

    result = await db.execute(select(UserProfile).where(UserProfile.id == profile_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Only update allowed fields from the validated schema
    update_fields = update_data.model_dump(exclude_unset=True)
    ALLOWED_FIELDS = {
        "business_name", "service_types", "base_callout_fee", "hourly_rate",
        "markup_pct", "min_labour_hours", "base_address", "service_radius_km",
        "travel_rate_per_km", "timezone", "working_hours",
    }
    for key, value in update_fields.items():
        if key in ALLOWED_FIELDS:
            setattr(profile, key, value)

    await db.commit()
    await db.refresh(profile)
    return profile
