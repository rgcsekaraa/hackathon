"""
Redis-backed FIFO job queue for lead/photo background processing.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from core.config import settings

logger = logging.getLogger(__name__)

_redis = None
QUEUE_KEY = "jobs:lead_pipeline"


async def _get_redis():
    global _redis
    if not settings.redis_enabled:
        return None
    if _redis is None:
        try:
            import redis.asyncio as aioredis

            _redis = aioredis.from_url(settings.redis_url, decode_responses=True)
            await _redis.ping()
            logger.info("Job queue connected to Redis at %s", settings.redis_url)
        except Exception as exc:
            logger.warning("Job queue Redis unavailable: %s", exc)
            _redis = None
    return _redis


async def is_queue_available() -> bool:
    return await _get_redis() is not None


async def enqueue_job(job: dict[str, Any]) -> bool:
    """Push a job payload to the queue. Returns False when queue is unavailable."""
    client = await _get_redis()
    if not client:
        return False
    try:
        await client.lpush(QUEUE_KEY, json.dumps(job))
        return True
    except Exception as exc:
        logger.warning("Failed to enqueue job: %s", exc)
        return False


async def dequeue_job(timeout_seconds: int = 5) -> dict[str, Any] | None:
    """
    Block until a job is available (or timeout). Returns parsed dict payload.
    Uses BRPOP so jobs are processed FIFO with LPUSH.
    """
    client = await _get_redis()
    if not client:
        return None
    try:
        result = await client.brpop(QUEUE_KEY, timeout=timeout_seconds)
        if not result:
            return None
        _, payload = result
        return json.loads(payload)
    except Exception as exc:
        logger.warning("Failed to dequeue job: %s", exc)
        return None

