"""
Presence tracking service using Upstash Redis REST API.
Tracks which users are online in each room with heartbeat-based TTL.
"""

from services.redis_client import get_redis, is_redis_available

HEARTBEAT_TTL = 90  # seconds — room presence expires if no heartbeat


async def join_room(room_id: str, user_id: str, display_name: str) -> list[str]:
    """
    Mark a user as online in a room.
    Returns list of currently online user_ids.
    """
    if not is_redis_available():
        return []

    try:
        redis = await get_redis()

        # Add user to room presence hash
        await redis.hset(f"presence:{room_id}", user_id, display_name)
        await redis.expire(f"presence:{room_id}", HEARTBEAT_TTL)

        # Track which rooms this user is in
        await redis.sadd(f"user_rooms:{user_id}", room_id)

        # Mark user globally online
        await redis.set(f"online:{user_id}", "1", ex=HEARTBEAT_TTL)

        # Return current online users
        return await get_online_users(room_id)
    except Exception as e:
        print(f"Presence join error: {e}")
        return []


async def leave_room(room_id: str, user_id: str) -> list[str]:
    """
    Mark a user as offline in a room.
    Returns remaining online user_ids.
    """
    if not is_redis_available():
        return []

    try:
        redis = await get_redis()

        await redis.hdel(f"presence:{room_id}", user_id)
        await redis.srem(f"user_rooms:{user_id}", room_id)

        # Check if user is in any other rooms
        remaining = await redis.scard(f"user_rooms:{user_id}")
        if remaining == 0:
            await redis.delete(f"online:{user_id}")

        return await get_online_users(room_id)
    except Exception as e:
        print(f"Presence leave error: {e}")
        return []


async def heartbeat(room_id: str, user_id: str):
    """
    Refresh presence TTL. Should be called every ~30 seconds by the client.
    """
    if not is_redis_available():
        return

    try:
        redis = await get_redis()
        await redis.expire(f"presence:{room_id}", HEARTBEAT_TTL)
        await redis.expire(f"online:{user_id}", HEARTBEAT_TTL)
    except Exception as e:
        print(f"Heartbeat error: {e}")


async def get_online_users(room_id: str) -> list[str]:
    """Get list of online user_ids in a room."""
    if not is_redis_available():
        return []

    try:
        redis = await get_redis()
        users = await redis.hgetall(f"presence:{room_id}")
        return list(users.keys()) if users else []
    except Exception:
        return []


async def get_online_users_with_names(room_id: str) -> dict[str, str]:
    """Get dict of {user_id: display_name} for online users in a room."""
    if not is_redis_available():
        return {}

    try:
        redis = await get_redis()
        result = await redis.hgetall(f"presence:{room_id}")
        return result if result else {}
    except Exception:
        return {}


async def is_user_online(user_id: str) -> bool:
    """Check if a user is online globally."""
    if not is_redis_available():
        return False

    try:
        redis = await get_redis()
        return await redis.exists(f"online:{user_id}") > 0
    except Exception:
        return False
