"""
User/Profile endpoints for BondBox.
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_ANON_KEY
from services import leaderboard_cache
from services import presence as presence_service

router = APIRouter(prefix="/api/users", tags=["users"])


def get_supabase(authorization: str | None = None):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        client.auth.set_session(token, token)
        return client
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    current_mood: Optional[str] = None
    subject_expertise: Optional[List[str]] = None
    expertise: Optional[List[str]] = None
    onboarding_completed: Optional[bool] = None


@router.get("/me")
async def get_my_profile(authorization: Optional[str] = Header(None)):
    """Get the authenticated user's profile."""
    supabase = get_supabase(authorization)
    user = supabase.auth.get_user()
    if not user or not user.user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    result = (
        supabase.table("profiles")
        .select("*")
        .eq("id", user.user.id)
        .single()
        .execute()
    )
    return {"profile": result.data}


@router.put("/me")
async def update_my_profile(
    body: UpdateProfileRequest, authorization: Optional[str] = Header(None)
):
    """Update the authenticated user's profile."""
    supabase = get_supabase(authorization)
    user = supabase.auth.get_user()
    if not user or not user.user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = (
        supabase.table("profiles")
        .update(updates)
        .eq("id", user.user.id)
        .execute()
    )
    return {"profile": result.data[0] if result.data else None}


@router.get("/{user_id}")
async def get_profile(user_id: str, authorization: Optional[str] = Header(None)):
    """Get a user's public profile."""
    supabase = get_supabase(authorization)
    result = (
        supabase.table("profiles")
        .select("id, display_name, avatar_url, bio, current_mood, xp, teaching_xp, room_coins, subject_expertise, is_online")
        .eq("id", user_id)
        .single()
        .execute()
    )

    # Enrich with live online status from Redis
    is_online = await presence_service.is_user_online(user_id)
    profile = result.data
    if profile:
        profile["is_online"] = is_online

    return {"profile": profile}


@router.get("/leaderboard/xp")
async def get_leaderboard(
    limit: int = 10, authorization: Optional[str] = Header(None)
):
    """Get top users by XP. Served from Redis cache when available."""
    # Try Redis cache first
    cached = await leaderboard_cache.get_cached_leaderboard(limit)
    if cached:
        return {"leaderboard": cached, "source": "cache"}

    # Fall back to Supabase
    supabase = get_supabase(authorization)
    result = (
        supabase.table("profiles")
        .select("id, display_name, avatar_url, xp, teaching_xp, room_coins")
        .order("xp", desc=True)
        .limit(limit)
        .execute()
    )
    return {"leaderboard": result.data, "source": "database"}
