"""
Redis client singleton for BondBox.
Uses Upstash Redis REST API (HTTP-based) — works everywhere, no TLS socket issues.
"""

from upstash_redis.asyncio import Redis as AsyncRedis
from config import UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN

# Global Redis connection
_redis: AsyncRedis | None = None


async def get_redis() -> AsyncRedis:
    """Get the shared Redis connection."""
    global _redis
    if _redis is None:
        raise RuntimeError("Redis not initialized. Call init_redis() first.")
    return _redis


async def init_redis() -> AsyncRedis | None:
    """
    Initialize the Upstash Redis client.
    Call this during FastAPI startup.
    """
    global _redis

    if not UPSTASH_REDIS_REST_URL or not UPSTASH_REDIS_REST_TOKEN:
        print("⚠️  Upstash Redis credentials not set. Redis features will be degraded.")
        return None

    try:
        _redis = AsyncRedis(
            url=UPSTASH_REDIS_REST_URL,
            token=UPSTASH_REDIS_REST_TOKEN,
        )
        # Verify connection
        result = await _redis.ping()
        print(f"✅ Redis connected: {UPSTASH_REDIS_REST_URL}")
        return _redis
    except Exception as e:
        print(f"⚠️  Redis connection failed: {e}")
        print("   Features requiring Redis (presence, rate limiting, leaderboard cache) will be degraded.")
        _redis = None
        return None


async def close_redis():
    """Close the Redis connection. Call during FastAPI shutdown."""
    global _redis
    if _redis:
        await _redis.close()
        _redis = None
        print("🔌 Redis disconnected")


def is_redis_available() -> bool:
    """Check if Redis is connected and available."""
    return _redis is not None
