"""Quick test to verify Redis/Upstash connection."""
import redis
import sys

print(f"redis-py version: {redis.__version__}")
print(f"Python version: {sys.version}")

url = "rediss://default:AdxIAAIncDI4ZjQyMTIxYTQ4MTE0M2IzYWEyNDgzZThjYWU5NWNjZXAyNTYzOTI@present-hyena-56392.upstash.io:6379"

try:
    r = redis.from_url(url, decode_responses=True)
    result = r.ping()
    print(f"PING result: {result}")
    r.set("test_key", "hello_bondbox")
    val = r.get("test_key")
    print(f"GET test_key: {val}")
    r.delete("test_key")
    print("SUCCESS: Redis connection works!")
except Exception as e:
    print(f"FAILED: {e}")
    import traceback
    traceback.print_exc()
