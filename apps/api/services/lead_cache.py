"""
Redis-backed lead and tradie hot-cache for ultra-fast AI data access.

Instead of querying SQLite on every pipeline step, we cache active leads
and tradie profiles in Redis. Cache invalidation is handled via TTL + explicit
invalidation on writes.

Latency: ~1ms Redis vs ~15ms SQLite.
"""

import json
import logging
from typing import Optional

from core.config import settings

logger = logging.getLogger(__name__)

# Redis client -- lazily initialized
_redis = None

LEAD_TTL = 1800       # 30 minutes
TRADIE_TTL = 3600     # 1 hour
QUOTE_TTL = 900       # 15 minutes


async def _get_redis():
    """Get or create the async Redis client."""
    global _redis
    if not settings.redis_enabled:
        return None
    if _redis is None:
        try:
            import redis.asyncio as aioredis
            _redis = aioredis.from_url(
                settings.redis_url,
                decode_responses=True,
            )
            await _redis.ping()
            logger.info("Lead cache connected to Redis")
        except Exception as exc:
            logger.warning("Redis unavailable for lead cache: %s", exc)
            _redis = None
    return _redis


# ---------------------------------------------------------------------------
# Lead Cache
# ---------------------------------------------------------------------------

async def cache_lead(lead_id: str, lead_data: dict, ttl: int = LEAD_TTL) -> None:
    """Cache a lead's full data for fast AI retrieval."""
    r = await _get_redis()
    if not r:
        return
    try:
        key = f"lead:{lead_id}"
        await r.set(key, json.dumps(lead_data), ex=ttl)
        # Also add to active leads set for quick listing
        await r.sadd("active_leads", lead_id)
        await r.expire("active_leads", LEAD_TTL)
    except Exception as exc:
        logger.warning("Failed to cache lead %s: %s", lead_id, exc)


async def get_cached_lead(lead_id: str) -> Optional[dict]:
    """Get a lead from cache (~1ms vs ~15ms from SQLite)."""
    r = await _get_redis()
    if not r:
        return None
    try:
        data = await r.get(f"lead:{lead_id}")
        return json.loads(data) if data else None
    except Exception:
        return None


async def invalidate_lead(lead_id: str) -> None:
    """Remove a lead from cache (call on status change)."""
    r = await _get_redis()
    if not r:
        return
    try:
        await r.delete(f"lead:{lead_id}")
        await r.srem("active_leads", lead_id)
    except Exception:
        pass


async def get_active_lead_ids() -> list[str]:
    """Get all active lead IDs from cache."""
    r = await _get_redis()
    if not r:
        return []
    try:
        return list(await r.smembers("active_leads"))
    except Exception:
        return []


# ---------------------------------------------------------------------------
# Tradie Profile Cache
# ---------------------------------------------------------------------------

async def cache_tradie(tradie_id: str, profile: dict, ttl: int = TRADIE_TTL) -> None:
    """Cache a tradie's profile (rates, address, service radius)."""
    r = await _get_redis()
    if not r:
        return
    try:
        await r.set(f"tradie:{tradie_id}", json.dumps(profile), ex=ttl)
    except Exception as exc:
        logger.warning("Failed to cache tradie %s: %s", tradie_id, exc)


async def get_cached_tradie(tradie_id: str) -> Optional[dict]:
    """Get a tradie profile from cache."""
    r = await _get_redis()
    if not r:
        return None
    try:
        data = await r.get(f"tradie:{tradie_id}")
        return json.loads(data) if data else None
    except Exception:
        return None


async def invalidate_tradie(tradie_id: str) -> None:
    """Remove tradie profile from cache."""
    r = await _get_redis()
    if not r:
        return
    try:
        await r.delete(f"tradie:{tradie_id}")
    except Exception:
        pass


# ---------------------------------------------------------------------------
# Quote Snapshot Cache
# ---------------------------------------------------------------------------

async def cache_quote(lead_id: str, quote_data: dict, ttl: int = QUOTE_TTL) -> None:
    """Cache a generated quote for instant retrieval."""
    r = await _get_redis()
    if not r:
        return
    try:
        await r.set(f"quote:{lead_id}", json.dumps(quote_data), ex=ttl)
    except Exception:
        pass


async def get_cached_quote(lead_id: str) -> Optional[dict]:
    """Get a cached quote."""
    r = await _get_redis()
    if not r:
        return None
    try:
        data = await r.get(f"quote:{lead_id}")
        return json.loads(data) if data else None
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Pipeline Context Cache (for multi-turn conversations)
# ---------------------------------------------------------------------------

async def cache_conversation_context(
    lead_id: str,
    context: dict,
    ttl: int = LEAD_TTL,
) -> None:
    """Cache conversation context for multi-turn call handling."""
    r = await _get_redis()
    if not r:
        return
    try:
        await r.set(f"ctx:{lead_id}", json.dumps(context), ex=ttl)
    except Exception:
        pass


async def get_conversation_context(lead_id: str) -> Optional[dict]:
    """Get cached conversation context."""
    r = await _get_redis()
    if not r:
        return None
    try:
        data = await r.get(f"ctx:{lead_id}")
        return json.loads(data) if data else None
    except Exception:
        return None


async def append_to_conversation(lead_id: str, message: dict) -> None:
    """Append a message to the cached conversation context."""
    ctx = await get_conversation_context(lead_id) or {"messages": []}
    ctx["messages"].append(message)
    await cache_conversation_context(lead_id, ctx)
