import json
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.session import get_db, AsyncSessionLocal
from core.auth import decode_token
from models.user import User
from models.workspace import WorkspaceComponent
from services.ai_service import process_utterance
from services.workspace_service import apply_intents_to_workspace, _model_to_dict
from services.notifications import register_token, send_push

logger = logging.getLogger(__name__)

router = APIRouter()

# Active WebSocket connections grouped by user_id
active_connections: dict[str, list[WebSocket]] = {}


async def broadcast_to_user(user_id: str, message: dict, exclude: WebSocket | None = None):
    """Send a message to all clients of a specific user."""
    connections = active_connections.get(user_id, [])
    payload = json.dumps(message)
    for ws in connections:
        if ws is not exclude:
            try:
                await ws.send_text(payload)
            except Exception:
                logger.warning("Failed to send message to a client for user %s", user_id)


async def get_ws_user(token: str) -> Optional[User]:
    """Validate JWT for WebSocket connection."""
    payload = decode_token(token)
    if not payload: return None
    user_id = payload.get("sub")
    if not user_id: return None
    
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()


@router.websocket("/ws/session")
async def websocket_session(
    websocket: WebSocket,
    token: str = Query(...)
):
    """
    WebSocket handler with JWT authentication.
    Syncs task data from SQLite and handles realtime AI/action updates.
    """
    user = await get_ws_user(token)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    user_id = user.id

    # Register connection
    if user_id not in active_connections:
        active_connections[user_id] = []
    active_connections[user_id].append(websocket)

    logger.info("User %s connected (total: %d)", user_id, len(active_connections[user_id]))

    # Send initial status
    await websocket.send_text(json.dumps({
        "type": "status",
        "status": "synced",
        "message": f"Welcome back, {user.full_name or user.email}",
    }))

    try:
        while True:
            raw = await websocket.receive_text()
            message = json.loads(raw)
            msg_type = message.get("type")

            async with AsyncSessionLocal() as db:
                if msg_type == "utterance":
                    await broadcast_to_user(user_id, {
                        "type": "status",
                        "status": "thinking",
                        "message": "Processing...",
                    })

                    text = message.get("text", "")
                    
                    # Fetch current state for AI context
                    result = await db.execute(select(WorkspaceComponent).where(WorkspaceComponent.user_id == user_id).order_by(WorkspaceComponent.order_index))
                    tasks = result.scalars().all()
                    workspace_ctx = {"components": {t.id: _model_to_dict(t) for t in tasks}, "order": [t.id for t in tasks]}

                    # AI pipeline
                    intents = await process_utterance(text, workspace_ctx)
                    await broadcast_to_user(user_id, {"type": "intent_parsed", "intents": intents})

                    # Apply to DB
                    operations = await apply_intents_to_workspace(intents, db, user_id)
                    await db.commit()

                    if operations:
                        await broadcast_to_user(user_id, {"type": "patch", "operations": operations})

                    await broadcast_to_user(user_id, {"type": "status", "status": "synced", "message": "Updated"})

                elif msg_type == "action":
                    action = message.get("action")
                    component_id = message.get("componentId")
                    
                    result = await db.execute(select(WorkspaceComponent).where(WorkspaceComponent.id == component_id, WorkspaceComponent.user_id == user_id))
                    comp = result.scalar_one_or_none()

                    if comp:
                        if action == "toggle_complete":
                            comp.completed = not comp.completed
                            await broadcast_to_user(user_id, {
                                "type": "patch",
                                "operations": [{"op": "update", "componentId": comp.id, "changes": {"completed": comp.completed}}],
                            })
                        elif action == "delete":
                            await db.delete(comp)
                            await broadcast_to_user(user_id, {
                                "type": "patch",
                                "operations": [{"op": "remove", "componentId": comp.id}],
                            })
                        
                        await db.commit()

                elif msg_type == "sync_request":
                    result = await db.execute(select(WorkspaceComponent).where(WorkspaceComponent.user_id == user_id).order_by(WorkspaceComponent.order_index))
                    tasks = result.scalars().all()
                    await websocket.send_text(json.dumps({
                        "type": "patch",
                        "operations": [{"op": "add", "component": _model_to_dict(t)} for t in tasks],
                    }))

    except WebSocketDisconnect:
        active_connections[user_id].remove(websocket)
        if not active_connections[user_id]:
            del active_connections[user_id]
    except Exception as exc:
        logger.error("WebSocket error for user %s: %s", user_id, exc)
        if websocket in active_connections.get(user_id, []):
            active_connections[user_id].remove(websocket)
