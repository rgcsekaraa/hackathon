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

    # CORS -- comma-separated origins (set CORS_ORIGINS env var for production)
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
    ]

    # Frontend URL (used for OAuth callbacks and SMS links)
    frontend_url: str = "http://localhost:3000"

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
    admin_emails: list[str] = ["superadmin@sophiie.ai"]
    bootstrap_admin_enabled: bool = True
    bootstrap_admin_alias: str = "demo-SA"
    bootstrap_admin_email: str = "superadmin@sophiie.ai"
    bootstrap_admin_password: str = "d3m0-p@s5"
    bootstrap_admin_name: str = "Demo Super Admin"

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
    livekit_url: str = "wss://sophiie-orbit.livekit.cloud"



    # Default pricing (fallback if tradie hasn't configured)
    default_callout_fee: float = 80.0
    default_hourly_rate: float = 95.0
    default_markup_pct: float = 15.0

    # Default business info (fallback for voice pipeline when no profile exists)
    default_business_name: str = "Gold Coast Plumbing"
    default_base_address: str = "Burleigh Heads, QLD"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }


settings = Settings()
