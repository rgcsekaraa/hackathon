"""
Application settings loaded from environment variables.

Uses pydantic-settings for validation and type coercion.
All secrets come from .env -- never hardcode them.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Central configuration for the API."""

    # Server
    app_name: str = "Spatial Voice API"
    debug: bool = False

    # CORS -- comma-separated origins
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
    ]

    # OpenRouter LLM
    openrouter_api_key: str = ""
    openrouter_model: str = "anthropic/claude-sonnet-4"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    # Redis (optional -- gracefully degrades if unavailable)
    redis_url: str = "redis://localhost:6379"
    redis_enabled: bool = False

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }


settings = Settings()
