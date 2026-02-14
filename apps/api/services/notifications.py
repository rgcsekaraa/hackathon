"""
Push notification service -- sends Expo push notifications.

Uses the Expo Push API to deliver native push notifications
to registered mobile devices when workspace events occur.
"""

import logging
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

# In-memory storage of push tokens per session.
# In production this would be in a database.
push_tokens: dict[str, set[str]] = {}


def register_token(session_id: str, token: str) -> None:
    """Register an Expo push token for a session."""
    if session_id not in push_tokens:
        push_tokens[session_id] = set()
    push_tokens[session_id].add(token)
    logger.info("Registered push token for session %s: %s", session_id, token[:20])


def unregister_token(session_id: str, token: str) -> None:
    """Remove a push token from a session."""
    if session_id in push_tokens:
        push_tokens[session_id].discard(token)


async def send_push(
    session_id: str,
    title: str,
    body: str,
    data: Optional[dict] = None,
    exclude_token: Optional[str] = None,
) -> None:
    """
    Send a push notification to all registered tokens in a session.

    Optionally excludes a specific token (the sender's device).
    """
    tokens = push_tokens.get(session_id, set())
    if not tokens:
        return

    messages = []
    for token in tokens:
        if token == exclude_token:
            continue
        msg = {
            "to": token,
            "title": title,
            "body": body,
            "sound": "default",
            "priority": "high",
        }
        if data:
            msg["data"] = data
        messages.append(msg)

    if not messages:
        return

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                EXPO_PUSH_URL,
                json=messages,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            logger.info("Sent %d push notifications for session %s", len(messages), session_id)
    except Exception as exc:
        logger.error("Push notification failed: %s", exc)
