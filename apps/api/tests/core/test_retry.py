import pytest

from core.retry import retry_async


@pytest.mark.asyncio
async def test_retry_async_succeeds_after_retries() -> None:
    attempts = {"count": 0}

    async def flaky() -> str:
        attempts["count"] += 1
        if attempts["count"] < 3:
            raise ValueError("temporary")
        return "ok"

    result = await retry_async(
        flaky,
        max_attempts=3,
        base_delay=0.0,
        max_delay=0.0,
        retryable_exceptions=(ValueError,),
    )

    assert result == "ok"
    assert attempts["count"] == 3


@pytest.mark.asyncio
async def test_retry_async_raises_after_max_attempts() -> None:
    attempts = {"count": 0}

    async def always_fail() -> None:
        attempts["count"] += 1
        raise RuntimeError("nope")

    with pytest.raises(RuntimeError):
        await retry_async(
            always_fail,
            max_attempts=2,
            base_delay=0.0,
            max_delay=0.0,
            retryable_exceptions=(RuntimeError,),
        )

    assert attempts["count"] == 2


@pytest.mark.asyncio
async def test_retry_async_does_not_retry_non_retryable_exception() -> None:
    attempts = {"count": 0}

    async def fail_with_type_error() -> None:
        attempts["count"] += 1
        raise TypeError("not retryable")

    with pytest.raises(TypeError):
        await retry_async(
            fail_with_type_error,
            max_attempts=3,
            base_delay=0.0,
            max_delay=0.0,
            retryable_exceptions=(ValueError,),
        )

    assert attempts["count"] == 1

