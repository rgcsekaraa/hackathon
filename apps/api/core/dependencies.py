"""
FastAPI dependency injection providers.

Centralized place for request-scoped and app-scoped dependencies.
"""


async def get_session_id() -> str:
    """
    Placeholder for session ID extraction from request.
    In production this would come from auth tokens or path params.
    """
    return "default"
