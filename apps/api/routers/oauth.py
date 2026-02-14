import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from fastapi_sso.sso.google import GoogleSSO
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.session import get_db
from models.user import User
from core.auth import create_access_token
from core.config import settings

router = APIRouter()

google_sso = GoogleSSO(
    client_id=settings.google_client_id,
    client_secret=settings.google_client_secret,
    redirect_uri=settings.google_redirect_uri,
    allow_insecure_http=True  # For local development
)

@router.get("/google/login")
async def google_login():
    """Redirect to Google Login page."""
    with google_sso:
        return await google_sso.get_login_redirect()

@router.get("/google/callback")
async def google_callback(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Google Login callback, create/verify user and return JWT."""
    with google_sso:
        try:
            user_info = await google_sso.verify_and_process(request)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Could not verify Google login: {str(e)}"
            )

    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No user information received from Google"
        )

    # Check if user exists by google_id or email
    result = await db.execute(
        select(User).where((User.google_id == user_info.id) | (User.email == user_info.email))
    )
    user = result.scalar_one_or_none()

    if not user:
        # Create new user for first-time SSO
        user = User(
            id=str(uuid.uuid4()),
            email=user_info.email,
            full_name=user_info.display_name or user_info.email,
            google_id=user_info.id,
            hashed_password=None,  # No password for SSO users
            is_verified=True # Google already verified the email
        )
        db.add(user)
    else:
        # Link existing user to Google if not linked
        if not user.google_id:
            user.google_id = user_info.id
        
        # Ensure full_name is populated if previously null
        if not user.full_name:
            user.full_name = user_info.display_name or user_info.email

    await db.commit()
    await db.refresh(user)

    # Generate our JWT
    token = create_access_token(data={"sub": user.id})
    
    # In a typical browser flow, we might redirect to frontend with token in URL 
    # or set a secure cookie. For simplicity with our existing AuthContext, 
    # we'll redirect back to a callback page on the frontend.
    frontend_url = "http://localhost:3000/auth/callback"
    return RedirectResponse(f"{frontend_url}?token={token}")
