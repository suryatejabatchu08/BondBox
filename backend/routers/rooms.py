"""
Room endpoints for BondBox.
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_ANON_KEY
from services import presence as presence_service

router = APIRouter(prefix="/api/rooms", tags=["rooms"])


def get_supabase(authorization: str | None = None):
    """Create a Supabase client, optionally with user's JWT for RLS."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        client.auth.set_session(token, token)
        return client
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


class CreateRoomRequest(BaseModel):
    name: str
    room_type: str = "doubt_solving"
    subject: Optional[str] = None
    topic: Optional[str] = None
    max_members: int = 15
    timer_duration: int = 25
    break_duration: int = 5


class JoinRoomRequest(BaseModel):
    room_code: str


@router.get("/")
async def list_rooms(
    room_type: Optional[str] = None,
    is_active: bool = True,
    authorization: Optional[str] = Header(None),
):
    """List all study rooms, optionally filtered by type."""
    supabase = get_supabase(authorization)
    query = supabase.table("study_rooms").select(
        "*, host:profiles!study_rooms_host_id_fkey(id, display_name, avatar_url), "
        "member_count:room_members(count)"
    ).eq("is_active", is_active)

    if room_type:
        query = query.eq("room_type", room_type)

    result = query.order("created_at", desc=True).execute()
    return {"rooms": result.data}


@router.get("/{room_id}")
async def get_room(room_id: str, authorization: Optional[str] = Header(None)):
    """Get a single room with its members."""
    supabase = get_supabase(authorization)
    room = (
        supabase.table("study_rooms")
        .select(
            "*, host:profiles!study_rooms_host_id_fkey(id, display_name, avatar_url), "
            "members:room_members(*, user:profiles(id, display_name, avatar_url, current_mood, is_online))"
        )
        .eq("id", room_id)
        .single()
        .execute()
    )
    return {"room": room.data}


@router.get("/{room_id}/presence")
async def get_room_presence(room_id: str):
    """Get currently online users in a room from Redis."""
    online = await presence_service.get_online_users_with_names(room_id)
    return {
        "room_id": room_id,
        "online_count": len(online),
        "users": [
            {"user_id": uid, "display_name": name}
            for uid, name in online.items()
        ],
    }


@router.post("/")
async def create_room(
    body: CreateRoomRequest, authorization: Optional[str] = Header(None)
):
    """Create a new study room."""
    supabase = get_supabase(authorization)
    user = supabase.auth.get_user()
    if not user or not user.user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    result = (
        supabase.table("study_rooms")
        .insert(
            {
                "name": body.name,
                "room_type": body.room_type,
                "subject": body.subject,
                "topic": body.topic,
                "host_id": user.user.id,
                "max_members": body.max_members,
                "timer_duration": body.timer_duration,
                "break_duration": body.break_duration,
            }
        )
        .execute()
    )

    # Auto-join the host as a member
    room = result.data[0]
    supabase.table("room_members").insert(
        {"room_id": room["id"], "user_id": user.user.id, "role": "host"}
    ).execute()

    return {"room": room}


@router.post("/{room_id}/join")
async def join_room(room_id: str, authorization: Optional[str] = Header(None)):
    """Join an existing room."""
    supabase = get_supabase(authorization)
    user = supabase.auth.get_user()
    if not user or not user.user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    result = (
        supabase.table("room_members")
        .insert({"room_id": room_id, "user_id": user.user.id, "role": "member"})
        .execute()
    )
    return {"member": result.data[0] if result.data else None}


@router.post("/join-by-code")
async def join_by_code(
    body: JoinRoomRequest, authorization: Optional[str] = Header(None)
):
    """Join a room using its invite code."""
    supabase = get_supabase(authorization)
    user = supabase.auth.get_user()
    if not user or not user.user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Find the room by code
    room = (
        supabase.table("study_rooms")
        .select("*")
        .eq("room_code", body.room_code.upper())
        .eq("is_active", True)
        .single()
        .execute()
    )

    if not room.data:
        raise HTTPException(status_code=404, detail="Room not found")

    # Join it
    result = (
        supabase.table("room_members")
        .insert(
            {"room_id": room.data["id"], "user_id": user.user.id, "role": "member"}
        )
        .execute()
    )
    return {"room": room.data, "member": result.data[0] if result.data else None}


@router.post("/{room_id}/leave")
async def leave_room(room_id: str, authorization: Optional[str] = Header(None)):
    """Leave a room."""
    supabase = get_supabase(authorization)
    user = supabase.auth.get_user()
    if not user or not user.user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    supabase.table("room_members").delete().eq("room_id", room_id).eq(
        "user_id", user.user.id
    ).execute()
    return {"success": True}
