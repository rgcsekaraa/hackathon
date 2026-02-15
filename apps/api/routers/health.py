"""Health check endpoints. Liveness + deep readiness probe."""

import logging

import httpx
from fastapi import APIRouter

from core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health")
async def health_check():
    """Returns service status. Used by load balancers and monitoring."""
    return {"status": "healthy", "service": "spatial-voice-api"}


@router.get("/health/ready")
async def readiness_check():
    """
    Deep readiness check — pings each external service.

    Returns per-service status so you can see exactly what's connected.
    Use this to verify your .env keys are working.
    """
    checks: dict[str, str] = {}

    # OpenRouter
    if settings.openrouter_api_key:
        try:
            async with httpx.AsyncClient(timeout=5.0) as c:
                r = await c.get(
                    f"{settings.openrouter_base_url}/models",
                    headers={"Authorization": f"Bearer {settings.openrouter_api_key}"},
                )
                checks["openrouter"] = "ok" if r.status_code == 200 else f"http_{r.status_code}"
        except Exception as e:
            checks["openrouter"] = f"error: {e}"
    else:
        checks["openrouter"] = "no_key"

    # Deepgram
    if settings.deepgram_api_key:
        try:
            async with httpx.AsyncClient(timeout=5.0) as c:
                r = await c.get(
                    "https://api.deepgram.com/v1/projects",
                    headers={"Authorization": f"Token {settings.deepgram_api_key}"},
                )
                checks["deepgram"] = "ok" if r.status_code == 200 else f"http_{r.status_code}"
        except Exception as e:
            checks["deepgram"] = f"error: {e}"
    else:
        checks["deepgram"] = "no_key"

    # ElevenLabs
    if settings.elevenlabs_api_key:
        try:
            async with httpx.AsyncClient(timeout=5.0) as c:
                r = await c.get(
                    "https://api.elevenlabs.io/v1/user",
                    headers={"xi-api-key": settings.elevenlabs_api_key},
                )
                checks["elevenlabs"] = "ok" if r.status_code == 200 else f"http_{r.status_code}"
        except Exception as e:
            checks["elevenlabs"] = f"error: {e}"
    else:
        checks["elevenlabs"] = "no_key"

    # LiveKit
    if settings.livekit_api_key:
        checks["livekit"] = "configured"
    else:
        checks["livekit"] = "no_key"

    # Twilio
    if settings.twilio_account_sid and settings.twilio_auth_token:
        checks["twilio"] = "configured"
    else:
        checks["twilio"] = "no_key"

    # Google OAuth
    if settings.google_client_id:
        checks["google_oauth"] = "configured"
    else:
        checks["google_oauth"] = "no_key"

    all_ok = all(v in ("ok", "configured") for v in checks.values())

    return {
        "status": "ready" if all_ok else "degraded",
        "services": checks,
    }
