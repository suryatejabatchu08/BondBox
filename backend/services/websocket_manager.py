"""
WebSocket Connection Manager for BondBox.
Handles per-room connections for WebRTC signaling and canvas sync.
"""

from fastapi import WebSocket
import json
from typing import Dict, Set


class ConnectionManager:
    """Manages WebSocket connections grouped by room_id."""

    def __init__(self):
        # room_id -> {user_id: WebSocket}
        self.rooms: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, room_id: str, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if room_id not in self.rooms:
            self.rooms[room_id] = {}
        self.rooms[room_id][user_id] = websocket

        # Notify others in the room that a new peer joined
        await self.broadcast_to_room(
            room_id,
            {
                "type": "peer-joined",
                "userId": user_id,
                "peers": list(self.rooms[room_id].keys()),
            },
            exclude=user_id,
        )

    def disconnect(self, room_id: str, user_id: str):
        if room_id in self.rooms:
            self.rooms[room_id].pop(user_id, None)
            if not self.rooms[room_id]:
                del self.rooms[room_id]

    async def notify_disconnect(self, room_id: str, user_id: str):
        """Notify remaining peers that someone left."""
        await self.broadcast_to_room(
            room_id,
            {"type": "peer-left", "userId": user_id},
            exclude=user_id,
        )

    async def send_to_user(self, room_id: str, user_id: str, message: dict):
        """Send a message to a specific user in a room."""
        if room_id in self.rooms and user_id in self.rooms[room_id]:
            ws = self.rooms[room_id][user_id]
            try:
                await ws.send_json(message)
            except Exception:
                self.disconnect(room_id, user_id)

    async def broadcast_to_room(
        self, room_id: str, message: dict, exclude: str | None = None
    ):
        """Broadcast a message to all users in a room, optionally excluding one."""
        if room_id not in self.rooms:
            return
        dead_connections = []
        for uid, ws in self.rooms[room_id].items():
            if uid == exclude:
                continue
            try:
                await ws.send_json(message)
            except Exception:
                dead_connections.append(uid)

        for uid in dead_connections:
            self.disconnect(room_id, uid)

    def get_peers(self, room_id: str) -> list[str]:
        """Get list of user IDs in a room."""
        if room_id in self.rooms:
            return list(self.rooms[room_id].keys())
        return []


manager = ConnectionManager()
