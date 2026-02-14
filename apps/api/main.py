"""
Spatial Voice API -- FastAPI backend for realtime workspace orchestration.

Handles WebSocket sessions, AI intent parsing, and workspace state management.
Designed for low-latency streaming with OpenRouter LLM integration.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from routers import health, session, auth, oauth, search
from db.init_db import init_db

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown logic for the application."""
    # Initialize database tables
    await init_db()
    yield
    # Future: close Redis connection pool


app = FastAPI(
    title="sophiie-space",
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
