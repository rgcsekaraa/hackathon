import pytest

from routers import health
from core.config import settings


class _FakeResponse:
    def __init__(self, status_code: int):
        self.status_code = status_code


class _FakeAsyncClient:
    def __init__(self, timeout: float = 5.0):
        self.timeout = timeout

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def get(self, url: str, headers=None):  # noqa: ANN001
        if "openrouter" in url:
            return _FakeResponse(200)
        if "deepgram" in url:
            return _FakeResponse(200)
        if "elevenlabs" in url:
            return _FakeResponse(200)
        return _FakeResponse(404)


@pytest.mark.asyncio
async def test_health_endpoint_payload() -> None:
    payload = await health.health_check()
    assert payload["status"] == "healthy"
    assert "service" in payload


@pytest.mark.asyncio
async def test_readiness_reports_no_key_when_integrations_missing(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "openrouter_api_key", "")
    monkeypatch.setattr(settings, "deepgram_api_key", "")
    monkeypatch.setattr(settings, "elevenlabs_api_key", "")
    monkeypatch.setattr(settings, "livekit_api_key", "")
    monkeypatch.setattr(settings, "twilio_account_sid", "")
    monkeypatch.setattr(settings, "twilio_auth_token", "")
    monkeypatch.setattr(settings, "google_client_id", "")

    payload = await health.readiness_check()

    assert payload["status"] == "degraded"
    assert payload["services"]["openrouter"] == "no_key"
    assert payload["services"]["deepgram"] == "no_key"
    assert payload["services"]["elevenlabs"] == "no_key"
    assert payload["services"]["livekit"] == "no_key"
    assert payload["services"]["twilio"] == "no_key"
    assert payload["services"]["google_oauth"] == "no_key"


@pytest.mark.asyncio
async def test_readiness_reports_ready_when_configured_services_are_up(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "openrouter_api_key", "x")
    monkeypatch.setattr(settings, "deepgram_api_key", "x")
    monkeypatch.setattr(settings, "elevenlabs_api_key", "x")
    monkeypatch.setattr(settings, "livekit_api_key", "x")
    monkeypatch.setattr(settings, "twilio_account_sid", "sid")
    monkeypatch.setattr(settings, "twilio_auth_token", "token")
    monkeypatch.setattr(settings, "google_client_id", "google-client-id")
    monkeypatch.setattr(health.httpx, "AsyncClient", _FakeAsyncClient)

    payload = await health.readiness_check()

    assert payload["status"] == "ready"
    assert payload["services"]["openrouter"] == "ok"
    assert payload["services"]["deepgram"] == "ok"
    assert payload["services"]["elevenlabs"] == "ok"
    assert payload["services"]["livekit"] == "configured"
    assert payload["services"]["twilio"] == "configured"
    assert payload["services"]["google_oauth"] == "configured"

