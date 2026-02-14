"""
WebSocket session endpoint for realtime workspace communication.

Each session maintains a workspace document and handles:
- Client utterances (voice/text) forwarded to AI processing
- Direct user actions (reorder, edit, delete)
- Broadcasting patches to all connected clients
"""

import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from services.ai_service import process_utterance
from services.workspace_service import apply_intents_to_workspace

logger = logging.getLogger(__name__)

router = APIRouter()

# Active WebSocket connections grouped by session
active_connections: dict[str, list[WebSocket]] = {}

# In-memory workspace state per session (replaced by Yjs in Phase 4)
workspace_states: dict[str, dict] = {}


async def broadcast_to_session(session_id: str, message: dict, exclude: WebSocket | None = None):
    """Send a message to all clients in a session, optionally excluding the sender."""
    connections = active_connections.get(session_id, [])
    payload = json.dumps(message)
    for ws in connections:
        if ws is not exclude:
            try:
                await ws.send_text(payload)
            except Exception:
                logger.warning("Failed to send message to a client in session %s", session_id)


def get_or_create_workspace(session_id: str) -> dict:
    """Get the current workspace state, or create an empty one."""
    if session_id not in workspace_states:
        workspace_states[session_id] = {
            "components": {},
            "order": [],
            "meta": {
                "activeId": None,
                "lastEntities": {},
                "sessionId": session_id,
            },
        }
    return workspace_states[session_id]


@router.websocket("/ws/session/{session_id}")
async def websocket_session(websocket: WebSocket, session_id: str):
    """
    Main WebSocket handler for a workspace session.

    Clients connect here and exchange messages defined in the shared event types.
    The server processes utterances through the AI pipeline and broadcasts
    workspace patches to all connected clients.
    """
    await websocket.accept()

    # Register this connection
    if session_id not in active_connections:
        active_connections[session_id] = []
    active_connections[session_id].append(websocket)

    logger.info("Client connected to session %s (total: %d)", session_id, len(active_connections[session_id]))

    # Send current workspace state on connect
    workspace = get_or_create_workspace(session_id)
    await websocket.send_text(json.dumps({
        "type": "status",
        "status": "synced",
        "message": "Connected to workspace",
    }))

    try:
        while True:
            raw = await websocket.receive_text()
            message = json.loads(raw)
            msg_type = message.get("type")

            if msg_type == "utterance":
                # Tell all clients we are processing
                await broadcast_to_session(session_id, {
                    "type": "status",
                    "status": "thinking",
                    "message": "Processing your input...",
                })

                text = message.get("text", "")
                workspace = get_or_create_workspace(session_id)

                # Process through AI pipeline
                intents = await process_utterance(text, workspace)

                # Tell clients what the AI understood
                await broadcast_to_session(session_id, {
                    "type": "intent_parsed",
                    "intents": intents,
                })

                # Apply intents to workspace state deterministically
                operations = apply_intents_to_workspace(intents, workspace)

                # Broadcast the resulting patches
                if operations:
                    await broadcast_to_session(session_id, {
                        "type": "patch",
                        "operations": operations,
                    })

                # Done processing
                await broadcast_to_session(session_id, {
                    "type": "status",
                    "status": "synced",
                    "message": "Workspace updated",
                })

            elif msg_type == "action":
                # Direct user actions bypass AI -- apply immediately
                # This will be expanded in Phase 7
                pass

            elif msg_type == "sync_request":
                workspace = get_or_create_workspace(session_id)
                await websocket.send_text(json.dumps({
                    "type": "patch",
                    "operations": [
                        {"op": "add", "component": comp, "index": idx}
                        for idx, cid in enumerate(workspace["order"])
                        if (comp := workspace["components"].get(cid))
                    ],
                }))

    except WebSocketDisconnect:
        active_connections[session_id].remove(websocket)
        logger.info("Client disconnected from session %s (remaining: %d)", session_id, len(active_connections[session_id]))
        if not active_connections[session_id]:
            del active_connections[session_id]
    except Exception as exc:
        logger.error("WebSocket error in session %s: %s", session_id, exc)
        active_connections[session_id].remove(websocket)
