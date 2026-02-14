"""
WebSocket router for real-time lead events.

Mobile app connects here to receive live lead updates.
Authentication via JWT query parameter (same pattern as session.py).
"""

import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status

from core.auth import decode_token
from services.realtime.connection_manager import lead_manager

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/leads")
async def websocket_leads(
    websocket: WebSocket,
    token: str = Query(default=""),
):
    """
    WebSocket handler for tradie mobile app.

    Events sent TO client:
    - new_lead: A new lead has been created
    - lead_update: A lead's data changed (e.g., photo uploaded, quote updated)
    - lead_decided: A tradie approved/rejected a lead

    Events received FROM client:
    - decide: Tradie approves or rejects a lead
    - ping: Keep-alive

    Auth: JWT via ?token= query param.
    Falls back to anonymous "demo" tradie if no token (for demo/dev mode).
    """
    # Authenticate
    tradie_id = "demo-tradie"  # Default for demo mode

    if token:
        payload = decode_token(token)
        if payload and payload.get("sub"):
            tradie_id = payload["sub"]
        elif token != "demo":
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

    # Connect
    await lead_manager.connect(tradie_id, websocket)

    try:
        # Send initial status
        await websocket.send_text(json.dumps({
            "type": "connected",
            "tradie_id": tradie_id,
            "active_connections": lead_manager.active_count,
        }))

        while True:
            raw = await websocket.receive_text()

            try:
                message = json.loads(raw)
            except json.JSONDecodeError:
                continue

            msg_type = message.get("type")

            if msg_type == "decide":
                lead_id = message.get("lead_id")
                decision = message.get("decision")  # "approve" or "reject"

                if lead_id and decision:
                    logger.info(
                        "Tradie %s decided: %s on lead %s",
                        tradie_id, decision, lead_id,
                    )
                    await lead_manager.broadcast_lead_decided(
                        lead_id, decision, tradie_id
                    )

            elif msg_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))

    except WebSocketDisconnect:
        lead_manager.disconnect(tradie_id, websocket)
    except Exception as exc:
        logger.error("WebSocket error for tradie %s: %s", tradie_id, exc)
        lead_manager.disconnect(tradie_id, websocket)
