import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.session import get_db
from models.user import User
from schemas.auth import UserCreate, UserLogin, Token, UserOut
from core.auth import get_password_hash, verify_password, create_access_token

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
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
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
