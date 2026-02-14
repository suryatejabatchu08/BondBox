"""
BondBox FastAPI Backend
Main application entry point with REST APIs, WebSocket signaling, and Redis integration.
"""

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
import json

from config import CORS_ORIGINS
from routers import rooms, users
from services.websocket_manager import manager
from services.redis_client import init_redis, close_redis, is_redis_available
from services import presence as presence_service
from services import leaderboard_cache
from services.rate_limiter import RateLimitMiddleware


# ========================================
# Lifespan: startup / shutdown
# ========================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage Redis connection and background tasks."""
    # Startup
    await init_redis()

    # Start background leaderboard refresh task
    refresh_task = None
    if is_redis_available():
        refresh_task = asyncio.create_task(_leaderboard_refresh_loop())

    yield

    # Shutdown
    if refresh_task:
        refresh_task.cancel()
        try:
            await refresh_task
        except asyncio.CancelledError:
            pass
    await close_redis()


async def _leaderboard_refresh_loop():
    """Refresh leaderboard cache every 60 seconds."""
    while True:
        try:
            await leaderboard_cache.refresh_leaderboard()
        except Exception as e:
            print(f"Leaderboard refresh error: {e}")
        await asyncio.sleep(60)


app = FastAPI(
    title="BondBox API",
    description="Backend for BondBox collaborative study platform",
    version="1.0.0",
    lifespan=lifespan,
)

# Rate limiting middleware (must be added before CORS)
app.add_middleware(RateLimitMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST routers
app.include_router(rooms.router)
app.include_router(users.router)


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "service": "bondbox-api",
        "redis": is_redis_available(),
    }


# ========================================
# WebSocket endpoint for room signaling
# ========================================
@app.websocket("/ws/room/{room_id}")
async def room_websocket(
    websocket: WebSocket,
    room_id: str,
    user_id: str = Query(...),
    display_name: str = Query("Anonymous"),
):
    """
    WebSocket endpoint for a study room.
    Handles:
    - WebRTC signaling (offer, answer, ice-candidate)
    - Canvas drawing sync
    - Presence (join/leave/heartbeat)
    - Typing indicators
    """
    await manager.connect(room_id, user_id, websocket)

    # Register presence in Redis
    online_users = await presence_service.join_room(room_id, user_id, display_name)
    await manager.broadcast_to_room(
        room_id,
        {"type": "presence-update", "online": online_users},
    )

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            msg_type = message.get("type", "")

            # --- WebRTC Signaling ---
            if msg_type in ("webrtc-offer", "webrtc-answer", "webrtc-ice"):
                target_id = message.get("targetUserId")
                if target_id:
                    await manager.send_to_user(
                        room_id,
                        target_id,
                        {
                            "type": msg_type,
                            "userId": user_id,
                            "displayName": display_name,
                            "sdp": message.get("sdp"),
                            "candidate": message.get("candidate"),
                        },
                    )

            # --- Canvas Events ---
            elif msg_type == "canvas-draw":
                await manager.broadcast_to_room(
                    room_id,
                    {
                        "type": "canvas-draw",
                        "userId": user_id,
                        "drawData": message.get("drawData"),
                    },
                    exclude=user_id,
                )

            elif msg_type == "canvas-clear":
                await manager.broadcast_to_room(
                    room_id,
                    {"type": "canvas-clear", "userId": user_id},
                    exclude=user_id,
                )

            # --- Presence Heartbeat ---
            elif msg_type == "heartbeat":
                await presence_service.heartbeat(room_id, user_id)

            # --- Typing Indicators ---
            elif msg_type == "typing-start":
                # Set typing key in Redis with 3s TTL
                if is_redis_available():
                    from services.redis_client import get_redis
                    redis = await get_redis()
                    await redis.set(f"typing:{room_id}:{user_id}", display_name, ex=3)
                await manager.broadcast_to_room(
                    room_id,
                    {
                        "type": "typing-start",
                        "userId": user_id,
                        "displayName": display_name,
                    },
                    exclude=user_id,
                )

            elif msg_type == "typing-stop":
                if is_redis_available():
                    from services.redis_client import get_redis
                    redis = await get_redis()
                    await redis.delete(f"typing:{room_id}:{user_id}")
                await manager.broadcast_to_room(
                    room_id,
                    {"type": "typing-stop", "userId": user_id},
                    exclude=user_id,
                )

            # --- Get current peers ---
            elif msg_type == "get-peers":
                peers = manager.get_peers(room_id)
                await manager.send_to_user(
                    room_id,
                    user_id,
                    {"type": "peers-list", "peers": peers},
                )

    except WebSocketDisconnect:
        manager.disconnect(room_id, user_id)
        await manager.notify_disconnect(room_id, user_id)
        # Update Redis presence
        online_users = await presence_service.leave_room(room_id, user_id)
        await manager.broadcast_to_room(
            room_id,
            {"type": "presence-update", "online": online_users},
        )
    except Exception as e:
        manager.disconnect(room_id, user_id)
        await manager.notify_disconnect(room_id, user_id)
        await presence_service.leave_room(room_id, user_id)
        print(f"WebSocket error for user {user_id} in room {room_id}: {e}")
