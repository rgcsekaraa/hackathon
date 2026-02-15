"""
Lightweight async retry decorator for external API calls.

Provides exponential backoff with jitter for transient failures.
"""

import asyncio
import logging
import random
from functools import wraps
from typing import TypeVar, Callable, Any

logger = logging.getLogger(__name__)

T = TypeVar("T")


async def retry_async(
    fn: Callable,
    *args: Any,
    max_attempts: int = 3,
    base_delay: float = 0.5,
    max_delay: float = 5.0,
    retryable_exceptions: tuple = (Exception,),
    **kwargs: Any,
) -> Any:
    """
    Retry an async function with exponential backoff + jitter.

    Args:
        fn: Async function to call
        max_attempts: Maximum number of attempts
        base_delay: Base delay in seconds (doubles each attempt)
        max_delay: Maximum delay cap
        retryable_exceptions: Exception types to retry on
    """
    last_exc = None
    for attempt in range(max_attempts):
        try:
            return await fn(*args, **kwargs)
        except retryable_exceptions as exc:
            last_exc = exc
            if attempt < max_attempts - 1:
                delay = min(base_delay * (2 ** attempt), max_delay)
                jitter = random.uniform(0, delay * 0.3)
                wait = delay + jitter
                logger.warning(
                    "Retry %d/%d for %s after %.1fs: %s",
                    attempt + 1, max_attempts, fn.__name__, wait, exc,
                )
                await asyncio.sleep(wait)
            else:
                logger.error(
                    "All %d attempts failed for %s: %s",
                    max_attempts, fn.__name__, exc,
                )
    raise last_exc
