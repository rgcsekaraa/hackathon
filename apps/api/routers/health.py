"""Health check endpoint. Simple liveness probe."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """Returns service status. Used by load balancers and monitoring."""
    return {"status": "healthy", "service": "spatial-voice-api"}
