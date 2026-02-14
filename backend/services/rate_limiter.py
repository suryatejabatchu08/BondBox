"""
Rate limiter middleware using Upstash Redis REST API.
Uses sliding window pattern with sorted sets.
Gracefully degrades to no rate limiting if Redis is unavailable.
"""

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import time

from services.redis_client import get_redis, is_redis_available


# Rate limit configs: (max_requests, window_seconds)
RATE_LIMITS = {
    "default": (60, 60),         # 60 req/min for general API
    "auth": (5, 60),             # 5 req/min for auth endpoints
    "room_create": (10, 3600),   # 10 rooms/hour
    "leaderboard": (30, 60),     # 30 req/min for leaderboard
}


def _get_rate_limit_config(path: str, method: str) -> tuple[str, int, int]:
    """Determine rate limit config based on the request path."""
    if "/auth/" in path:
        key_prefix = "auth"
        max_req, window = RATE_LIMITS["auth"]
    elif path.endswith("/rooms") and method == "POST":
        key_prefix = "room_create"
        max_req, window = RATE_LIMITS["room_create"]
    elif "leaderboard" in path:
        key_prefix = "leaderboard"
        max_req, window = RATE_LIMITS["leaderboard"]
    else:
        key_prefix = "default"
        max_req, window = RATE_LIMITS["default"]

    return key_prefix, max_req, window


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Sliding window rate limiter using Upstash Redis sorted sets.
    Falls back to no rate limiting if Redis is unavailable.
    """

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks and WebSocket upgrades
        if request.url.path == "/api/health" or request.url.path.startswith("/ws/"):
            return await call_next(request)

        # Skip if Redis not available (graceful degradation)
        if not is_redis_available():
            return await call_next(request)

        # Identify the client
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            client_id = f"user:{hash(auth_header) % 10**10}"
        else:
            client_id = f"ip:{request.client.host if request.client else 'unknown'}"

        key_prefix, max_requests, window = _get_rate_limit_config(
            request.url.path, request.method
        )
        redis_key = f"rate:{key_prefix}:{client_id}"

        try:
            redis = await get_redis()
            now = time.time()
            window_start = now - window

            # Remove expired entries
            await redis.zremrangebyscore(redis_key, 0, window_start)
            # Count current entries
            current_count = await redis.zcard(redis_key)
            # Add current request
            await redis.zadd(redis_key, {str(now): now})
            # Set key expiry
            await redis.expire(redis_key, window)

            if current_count >= max_requests:
                retry_after = window

                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": "Too many requests",
                        "retry_after": retry_after,
                    },
                    headers={
                        "Retry-After": str(retry_after),
                        "X-RateLimit-Limit": str(max_requests),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": str(int(now + retry_after)),
                    },
                )

            response = await call_next(request)

            # Add rate limit headers to response
            remaining = max(0, max_requests - current_count - 1)
            response.headers["X-RateLimit-Limit"] = str(max_requests)
            response.headers["X-RateLimit-Remaining"] = str(remaining)
            response.headers["X-RateLimit-Reset"] = str(int(now + window))

            return response

        except Exception as e:
            # If Redis fails mid-request, let it through
            print(f"Rate limiter error: {e}")
            return await call_next(request)
