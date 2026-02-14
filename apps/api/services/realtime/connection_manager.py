"""
WebSocket Connection Manager for real-time lead events.

Manages tradie connections and broadcasts lead lifecycle events
(new lead, status update, decision) to connected mobile clients.
"""

import json
import logging
from typing import Optional

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Central WebSocket connection manager for lead events.

    Tracks active connections per tradie and provides broadcast methods.
    """

    def __init__(self) -> None:
        # tradie_id → list of connected WebSockets
        self._connections: dict[str, list[WebSocket]] = {}

    async def connect(self, tradie_id: str, websocket: WebSocket) -> None:
        """Accept and register a tradie's WebSocket connection."""
        await websocket.accept()
        if tradie_id not in self._connections:
            self._connections[tradie_id] = []
        self._connections[tradie_id].append(websocket)
        logger.info(
            "Tradie %s connected (total: %d)",
            tradie_id, len(self._connections[tradie_id]),
        )

    def disconnect(self, tradie_id: str, websocket: WebSocket) -> None:
        """Remove a WebSocket from the connection pool."""
        conns = self._connections.get(tradie_id, [])
        if websocket in conns:
            conns.remove(websocket)
        if not conns and tradie_id in self._connections:
            del self._connections[tradie_id]
        logger.info("Tradie %s disconnected", tradie_id)

    async def send_to_tradie(self, tradie_id: str, event: dict) -> None:
        """Send an event to all of a specific tradie's connections."""
        conns = self._connections.get(tradie_id, [])
        payload = json.dumps(event)
        dead_conns = []

        for ws in conns:
            try:
                await ws.send_text(payload)
            except Exception:
                dead_conns.append(ws)

        # Cleanup dead connections
        for ws in dead_conns:
            self.disconnect(tradie_id, ws)

    async def broadcast_all(self, event: dict) -> None:
        """Broadcast an event to ALL connected tradies."""
        payload = json.dumps(event)
        dead: list[tuple[str, WebSocket]] = []

        for tradie_id, conns in self._connections.items():
            for ws in conns:
                try:
                    await ws.send_text(payload)
                except Exception:
                    dead.append((tradie_id, ws))

        for tid, ws in dead:
            self.disconnect(tid, ws)

    async def broadcast_new_lead(self, lead_data: dict) -> None:
        """Broadcast a new lead to all connected tradies."""
        await self.broadcast_all({
            "type": "new_lead",
            "lead": lead_data,
        })

    async def broadcast_lead_update(self, lead_data: dict) -> None:
        """Broadcast a lead status update."""
        await self.broadcast_all({
            "type": "lead_update",
            "lead": lead_data,
        })

    async def broadcast_lead_decided(
        self, lead_id: str, decision: str, tradie_id: str
    ) -> None:
        """Broadcast that a tradie made a decision on a lead."""
        await self.broadcast_all({
            "type": "lead_decided",
            "lead_id": lead_id,
            "decision": decision,
            "decided_by": tradie_id,
        })

    @property
    def active_count(self) -> int:
        """Total number of active connections across all tradies."""
        return sum(len(conns) for conns in self._connections.values())

    @property
    def connected_tradies(self) -> list[str]:
        """List of currently connected tradie IDs."""
        return list(self._connections.keys())


# Singleton instance — imported by routers
lead_manager = ConnectionManager()
