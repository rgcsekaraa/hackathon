"""
LiveKit voice room management.

Creates and manages real-time voice rooms for tradie ↔ customer calls.
Future-ready: enables live consultations and on-site support calls.
"""

import logging
import time
from datetime import timedelta
from typing import Optional

from core.config import settings

logger = logging.getLogger(__name__)


async def create_call_room(lead_id: str, metadata: Optional[dict] = None) -> Optional[dict]:
    """
    Create a LiveKit room for a lead's voice call.

    Returns room details or None if LiveKit is not configured.
    """
    api_key = settings.livekit_api_key
    api_secret = settings.livekit_api_secret
    if not api_key or not api_secret:
        logger.info("LiveKit not configured — skipping room creation")
        return None

    try:
        from livekit.api import LiveKitAPI, CreateRoomRequest

        api = LiveKitAPI(
            url=settings.livekit_url,
            api_key=api_key,
            api_secret=api_secret,
        )

        room_name = f"lead-{lead_id}"
        room = await api.room.create_room(
            CreateRoomRequest(
                name=room_name,
                empty_timeout=300,  # 5 min idle timeout
                max_participants=3,  # Customer, Tradie, AI agent
                metadata=str(metadata) if metadata else "",
            )
        )

        logger.info("LiveKit room created: %s", room_name)
        return {
            "room_name": room.name,
            "room_sid": room.sid,
            "created_at": room.creation_time,
        }

    except ImportError:
        logger.warning("livekit-api not installed — skipping room creation")
        return None
    except Exception as exc:
        logger.error("Failed to create LiveKit room: %s", exc)
        return None


async def generate_participant_token(
    room_name: str,
    identity: str,
    role: str = "participant",
    ttl_seconds: int = 3600,
) -> Optional[str]:
    """
    Generate a JWT token for a participant to join a LiveKit room.

    Args:
        room_name: Name of the room to join
        identity: Unique identifier (e.g., "tradie-123" or "customer-456")
        role: "participant" or "agent"
        ttl_seconds: Token validity period
    """
    api_key = settings.livekit_api_key
    api_secret = settings.livekit_api_secret
    if not api_key or not api_secret:
        return None

    try:
        from livekit.api import AccessToken, VideoGrants

        token = AccessToken(api_key, api_secret)
        token.identity = identity
        token.name = identity
        token.with_ttl(timedelta(seconds=ttl_seconds))

        grants = VideoGrants(
            room_join=True,
            room=room_name,
            can_publish=True,
            can_subscribe=True,
        )
        token.video_grants = grants

        jwt_token = token.to_jwt()
        logger.info("LiveKit token generated for %s in room %s", identity, room_name)
        return jwt_token

    except ImportError:
        logger.warning("livekit-api not installed")
        return None
    except Exception as exc:
        logger.error("Failed to generate LiveKit token: %s", exc)
        return None


async def close_room(room_name: str) -> bool:
    """Close a LiveKit room and disconnect all participants."""
    api_key = settings.livekit_api_key
    api_secret = settings.livekit_api_secret
    if not api_key or not api_secret:
        return False

    try:
        from livekit.api import LiveKitAPI, DeleteRoomRequest

        api = LiveKitAPI(
            url=settings.livekit_url,
            api_key=api_key,
            api_secret=api_secret,
        )

        await api.room.delete_room(DeleteRoomRequest(room=room_name))
        logger.info("LiveKit room closed: %s", room_name)
        return True

    except Exception as exc:
        logger.error("Failed to close LiveKit room: %s", exc)
        return False
