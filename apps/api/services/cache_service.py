"""
Cache service -- prompt and semantic caching via Redis.

Reduces LLM latency for repeated or similar queries. Gracefully
degrades to no-op when Redis is unavailable.
"""

import hashlib
import json
import logging

from core.config import settings

logger = logging.getLogger(__name__)

# Redis client is lazily initialized
_redis_client = None


async def get_redis():
    """Get or create the Redis client. Returns None if Redis is disabled."""
    global _redis_client

    if not settings.redis_enabled:
        return None

    if _redis_client is None:
        try:
            import redis.asyncio as aioredis
            _redis_client = aioredis.from_url(
                settings.redis_url,
                decode_responses=True,
            )
            # Test connection
            await _redis_client.ping()
            logger.info("Connected to Redis at %s", settings.redis_url)
        except Exception as exc:
            logger.warning("Redis unavailable, caching disabled: %s", exc)
            _redis_client = None

    return _redis_client


def _cache_key(prefix: str, text: str) -> str:
    """Generate a deterministic cache key from text content."""
    text_hash = hashlib.sha256(text.encode()).hexdigest()[:16]
    return f"spatial:{prefix}:{text_hash}"


async def get_cached_intents(utterance: str) -> list[dict] | None:
    """Check if we have cached intents for this exact utterance."""
    client = await get_redis()
    if not client:
        return None

    try:
        key = _cache_key("intent", utterance.lower().strip())
        cached = await client.get(key)
        if cached:
            logger.info("Cache hit for utterance: %s", utterance[:50])
            return json.loads(cached)
    except Exception as exc:
        logger.warning("Cache read failed: %s", exc)

    return None


async def cache_intents(utterance: str, intents: list[dict], ttl: int = 3600):
    """Cache intents for a given utterance. Default TTL is 1 hour."""
    client = await get_redis()
    if not client:
        return

    try:
        key = _cache_key("intent", utterance.lower().strip())
        await client.set(key, json.dumps(intents), ex=ttl)
    except Exception as exc:
        logger.warning("Cache write failed: %s", exc)
