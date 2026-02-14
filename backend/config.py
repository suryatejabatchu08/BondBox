import os
from dotenv import load_dotenv
from pathlib import Path

# Load .env from the project root
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# Upstash Redis (REST API — no TCP/TLS socket issues on Windows)
UPSTASH_REDIS_REST_URL = os.getenv("UPSTASH_REDIS_REST_URL", "")
UPSTASH_REDIS_REST_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN", "")

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]

# Add production frontend URL from env var
_frontend_url = os.getenv("FRONTEND_URL", "")
if _frontend_url:
    CORS_ORIGINS.append(_frontend_url)

if not SUPABASE_URL:
    print("⚠️  SUPABASE_URL is not set. Check your .env file.")
if not UPSTASH_REDIS_REST_URL:
    print("⚠️  UPSTASH_REDIS_REST_URL is not set. Check your .env file.")
