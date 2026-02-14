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
from services.notifications import register_token, send_push

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

                # Push notification to other devices
                if operations:
                    titles = [op.get("component", {}).get("title", "") for op in operations if op.get("op") == "add"]
                    if titles:
                        await send_push(
                            session_id,
                            title="Spatial Voice",
                            body=f"New task: {titles[0]}" if len(titles) == 1 else f"{len(titles)} new tasks added",
                            data={"type": "workspace_update"},
                        )

            elif msg_type == "action":
                # Direct user actions bypass AI -- apply immediately
                action = message.get("action", "")
                component_id = message.get("componentId", "")
                payload = message.get("payload", {})
                workspace = get_or_create_workspace(session_id)
                components = workspace.get("components", {})

                if action == "toggle_complete" and component_id in components:
                    comp = components[component_id]
                    new_completed = not comp.get("completed", False)
                    comp["completed"] = new_completed
                    comp["updatedAt"] = datetime.now(timezone.utc).isoformat()
                    await broadcast_to_session(session_id, {
                        "type": "patch",
                        "operations": [{"op": "update", "componentId": component_id, "changes": {"completed": new_completed}}],
                    })

                elif action == "delete" and component_id in components:
                    components.pop(component_id, None)
                    if component_id in workspace["order"]:
                        workspace["order"].remove(component_id)
                    await broadcast_to_session(session_id, {
                        "type": "patch",
                        "operations": [{"op": "remove", "componentId": component_id}],
                    })

                elif action == "reorder" and component_id in components:
                    new_index = payload.get("newIndex", 0)
                    order = workspace["order"]
                    if component_id in order:
                        order.remove(component_id)
                    order.insert(min(new_index, len(order)), component_id)
                    await broadcast_to_session(session_id, {
                        "type": "patch",
                        "operations": [{"op": "reorder", "componentId": component_id, "newIndex": new_index}],
                    })

            elif msg_type == "register_push_token":
                token = message.get("token", "")
                if token:
                    register_token(session_id, token)
                    logger.info("Push token registered for session %s", session_id)

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
