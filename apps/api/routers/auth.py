import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.session import get_db
from models.user import User
from core.auth import get_password_hash, verify_password, create_access_token
from core.deps import get_current_user
from models.token import TokenBlacklist
from datetime import datetime, timedelta, timezone
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/signup", response_model=Token)
async def signup(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    """Create a new user account and return an access token."""
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )
    
    # Create user
    user = User(
        id=str(uuid.uuid4()),
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        verification_token=str(uuid.uuid4())
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    logger.info(f"EMAIL VERIFICATION TOKEN FOR {user.email}: {user.verification_token}")
    print(f"\n>>> EMAIL VERIFICATION TOKEN FOR {user.email}: {user.verification_token}\n")
    
    # Generate token
    token = create_access_token(data={"sub": user.id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate a user and return an access token."""
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate token
    token = create_access_token(data={"sub": user.id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }
from core.deps import get_current_user

@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Generate a password reset token and 'send' it via email (mocked)."""
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    
    if not user:
        # Don't reveal if user exists for security
        return {"message": "If your email is registered, you will receive a reset link shortly."}
    
    token = str(uuid.uuid4())
    user.reset_token = token
    user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
    
    await db.commit()
    
    # Mock Email Sending
    logger.info(f"PASSWORD RESET TOKEN FOR {user.email}: {token}")
    print(f"\n>>> PASSWORD RESET TOKEN FOR {user.email}: {token}\n")
    
    return {"message": "If your email is registered, you will receive a reset link shortly."}

@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Validate reset token and update password."""
    result = await db.execute(
        select(User).where(
            User.reset_token == req.token,
            User.reset_token_expires > datetime.now(timezone.utc)
        )
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    user.hashed_password = get_password_hash(req.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    
    await db.commit()
    return {"message": "Password updated successfully"}

@router.get("/verify-email")
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    """Mark user as verified based on UUID token."""
    result = await db.execute(select(User).where(User.verification_token == token))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    user.is_verified = True
    user.verification_token = None
    await db.commit()
    return {"message": "Email verified successfully"}

@router.post("/logout")
async def logout(
    current_token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    """Blacklist the current JWT session."""
    # Note: A real app would extract the expiry from the JWT 'exp' claim.
    # For now, we blacklist it for 7 days (the max dev expiry).
    expiry = datetime.now(timezone.utc) + timedelta(days=7)
    
    blacklist = TokenBlacklist(token=current_token, expires_at=expiry)
    db.add(blacklist)
    await db.commit()
    
    return {"message": "Logged out successfully"}
