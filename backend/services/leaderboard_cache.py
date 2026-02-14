"""
Leaderboard cache using Upstash Redis Sorted Sets.
Serves XP rankings from cache with periodic refresh from Supabase.
"""

from services.redis_client import get_redis, is_redis_available
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_ANON_KEY
import json

LEADERBOARD_KEY = "leaderboard:xp"
LEADERBOARD_DATA_KEY = "leaderboard:xp:data"
CACHE_TTL = 120  # Cache lives for 2 minutes


async def refresh_leaderboard():
    """
    Fetch top users from Supabase and store in Redis Sorted Set.
    Called periodically by a background task.
    """
    if not is_redis_available():
        return

    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        result = (
            supabase.table("profiles")
            .select("id, display_name, avatar_url, xp, teaching_xp, room_coins")
            .order("xp", desc=True)
            .limit(50)
            .execute()
        )

        if not result.data:
            return

        redis = await get_redis()

        # Clear old data
        await redis.delete(LEADERBOARD_KEY)
        await redis.delete(LEADERBOARD_DATA_KEY)

        # Store in sorted set (score = XP) and hash (profile metadata)
        for user in result.data:
            await redis.zadd(LEADERBOARD_KEY, {user["id"]: user.get("xp", 0)})
            await redis.hset(
                LEADERBOARD_DATA_KEY,
                user["id"],
                json.dumps({
                    "display_name": user.get("display_name", ""),
                    "avatar_url": user.get("avatar_url", ""),
                    "xp": user.get("xp", 0),
                    "teaching_xp": user.get("teaching_xp", 0),
                    "room_coins": user.get("room_coins", 0),
                }),
            )

        # Set TTL
        await redis.expire(LEADERBOARD_KEY, CACHE_TTL)
        await redis.expire(LEADERBOARD_DATA_KEY, CACHE_TTL)

        print("📊 Leaderboard cache refreshed")
    except Exception as e:
        print(f"Leaderboard refresh error: {e}")


async def get_cached_leaderboard(limit: int = 10) -> list[dict] | None:
    """
    Get leaderboard from Redis cache.
    Returns None if cache miss (caller should fall back to Supabase).
    """
    if not is_redis_available():
        return None

    try:
        redis = await get_redis()

        # Check if cache exists
        exists = await redis.exists(LEADERBOARD_KEY)
        if not exists:
            return None

        # Get top user IDs by score (descending)
        top_ids = await redis.zrange(LEADERBOARD_KEY, 0, limit - 1, rev=True)

        if not top_ids:
            return None

        # Fetch profile data for each
        leaderboard = []
        for user_id in top_ids:
            raw = await redis.hget(LEADERBOARD_DATA_KEY, user_id)
            if raw:
                data = json.loads(raw)
                data["id"] = user_id
                leaderboard.append(data)

        return leaderboard

    except Exception as e:
        print(f"Leaderboard cache read error: {e}")
        return None


async def invalidate_user_xp(user_id: str, new_xp: int):
    """
    Update a single user's XP in the cache without full refresh.
    """
    if not is_redis_available():
        return

    try:
        redis = await get_redis()
        await redis.zadd(LEADERBOARD_KEY, {user_id: new_xp})
    except Exception:
        pass
