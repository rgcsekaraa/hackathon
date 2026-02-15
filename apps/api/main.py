"""
Sophiie Orbit API -- FastAPI backend for realtime workspace orchestration.

Handles WebSocket sessions, AI intent parsing, and workspace state management.
Designed for low-latency streaming with OpenRouter LLM integration.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from routers import health, session, auth, oauth, search, leads, profile, voice, ws_leads, admin
from db.init_db import init_db
from services.bootstrap_admin import ensure_bootstrap_admin

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown logic for the application."""
    # Initialize database tables
    await init_db()
    await ensure_bootstrap_admin()
    yield
    # Future: close Redis connection pool


app = FastAPI(
    title="Sophiie Orbit",
    description="Realtime workspace orchestration for voice, text, and touch input",
    version="0.1.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Allow frontend origins in development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(oauth.router, prefix="/auth", tags=["oauth"])
app.include_router(session.router, tags=["session"])
app.include_router(search.router, tags=["search"])
app.include_router(leads.router, prefix="/api", tags=["leads"])
app.include_router(profile.router, prefix="/api", tags=["profile"])
app.include_router(voice.router, prefix="/api", tags=["voice"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(ws_leads.router, tags=["realtime"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
