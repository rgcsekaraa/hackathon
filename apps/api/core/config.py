"""
Application settings loaded from environment variables.

Uses pydantic-settings for validation and type coercion.
All secrets come from .env -- never hardcode them.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Central configuration for the API."""

    # Server
    app_name: str = "Sophiie Orbit"
    debug: bool = False

    # CORS -- comma-separated origins
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
    ]

    # OpenRouter LLM
    openrouter_api_key: str = ""
    openrouter_model: str = "anthropic/claude-sonnet-4"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    # Redis (optional -- gracefully degrades if unavailable)
    redis_url: str = "redis://localhost:6379"
    redis_enabled: bool = False

    # Database
    database_url: str = "sqlite+aiosqlite:///./spatial_voice.db"

    # Security
    secret_key: str = "supersecret_change_me_in_prod"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days for dev convenience

    # OAuth2 / Google SSO
    google_client_id: str = ""
    google_client_secret: str = ""
    # In dev, this might be http://localhost:8001/auth/google/callback
    google_redirect_uri: str = "http://localhost:8001/auth/google/callback"

    # Google Cloud Vision (image analysis)
    google_cloud_vision_key: str = ""

    # Google Maps / Distance Matrix
    google_maps_api_key: str = ""

    # Twilio (SMS)
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""

    # Deepgram (Speech-to-Text)
    deepgram_api_key: str = ""

    # ElevenLabs (Text-to-Speech)
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = "pNInz6obpgDQGcFmaJgB"  # "Adam" default

    # LiveKit (Real-time voice rooms)
    livekit_api_key: str = ""
    livekit_api_secret: str = ""
    livekit_url: str = "ws://localhost:7880"

    # Default pricing (fallback if tradie hasn't configured)
    default_callout_fee: float = 80.0
    default_hourly_rate: float = 95.0
    default_markup_pct: float = 15.0

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }


settings = Settings()
