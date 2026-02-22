from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Body
from typing import Optional, Dict, List
from datetime import datetime, timezone, timedelta
from services.storage_service import get_supabase_service

router = APIRouter(prefix="/api/glass", tags=["Smart Glass Relay"])

# In-memory buffer for latest frames (DB is too slow for 10fps streaming)
# Map: device_id -> bytes
frame_buffer: Dict[str, bytes] = {}

# In-memory command queue (DB is safer but for speed we use memory for now)
# Map: device_id -> List[dict]
command_queue: Dict[str, List[dict]] = {}

in_memory_devices: Dict[str, dict] = {}

scanning_state: Dict[str, dict] = {}


def get_scanning_state(device_id: str) -> dict:
    state = scanning_state.get(device_id)
    if not state:
        state = {"active": False, "last_stop": None}
        scanning_state[device_id] = state
    return state

@router.post("/sync")
async def sync_device(
    device_id: str = Form(...),
    battery: int = Form(0),
    image: Optional[UploadFile] = File(None)
):
    """
    Heartbeat from Glass.
    1. Updates 'Last Seen' in DB.
    2. Accepts incoming image frame.
    3. Returns pending commands for this device.
    """
    supabase = get_supabase_service()
    
    # 1. Update DB Status
    try:
        res = supabase.client.table("devices").select("user_id").eq("device_id", device_id).execute()
        if not res.data:
            # Auto-register new device
            supabase.client.table("devices").insert({
                "device_id": device_id,
                "status": "online",
                "battery_level": battery,
                "last_seen": datetime.utcnow().isoformat()
            }).execute()
        else:
            # Update existing
            supabase.client.table("devices").update({
                "status": "online",
                "battery_level": battery,
                "last_seen": datetime.utcnow().isoformat()
            }).eq("device_id", device_id).execute()
    except Exception as e:
        print(f"DB Error (using in-memory fallback): {e}")
        # Fallback to in-memory if DB fails (e.g. table missing)
        in_memory_devices[device_id] = {
            "device_id": device_id,
            "status": "online",
            "battery_level": battery,
            "last_seen": datetime.utcnow().isoformat(),
            "user_id": None # No pairing in memory mode yet
        }

    # 2. Handle Image
    if image:
        content = await image.read()
        frame_buffer[device_id] = content

    # 3. Get Commands
    commands = command_queue.get(device_id, [])
    if commands:
        command_queue[device_id] = [] # Clear queue
        
    return {
        "status": "ok", 
        "commands": commands, 
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/scanning/{device_id}")
async def get_scanning(device_id: str):
    state = get_scanning_state(device_id)
    return {
        "active": bool(state.get("active", False)),
        "last_stop": state.get("last_stop"),
    }


@router.post("/scanning/{device_id}")
async def set_scanning(
    device_id: str,
    payload: dict = Body(...),
):
    active = bool(payload.get("active", False))
    cooldown_ms = int(payload.get("cooldown_ms", 0))
    source = payload.get("source") or "unknown"
    state = get_scanning_state(device_id)
    now = datetime.utcnow()
    if not active:
        state["active"] = False
        state["last_stop"] = now.isoformat()
        scanning_state[device_id] = state
        return {"active": False, "source": source}
    last_stop_raw = state.get("last_stop")
    if last_stop_raw and cooldown_ms > 0:
        try:
            last_stop_dt = datetime.fromisoformat(str(last_stop_raw).replace("Z", "+00:00"))
        except Exception:
            last_stop_dt = None
        if last_stop_dt:
            if now - last_stop_dt < timedelta(milliseconds=cooldown_ms):
                return {"active": bool(state.get("active", False)), "source": source}
    state["active"] = True
    scanning_state[device_id] = state
    return {"active": True, "source": source}

@router.get("/status/{device_id}")
async def get_device_status(device_id: str):
    """Frontend polls this to check if Glass is online."""
    supabase = get_supabase_service()
    
    # Check DB for ownership/status
    try:
        res = supabase.client.table("devices").select("*").eq("device_id", device_id).execute()
        if not res.data:
            # Check in-memory fallback before 404
            if device_id in in_memory_devices:
                device = in_memory_devices[device_id]
            else:
                # If not in DB and not in memory, it's truly not found
                raise HTTPException(status_code=404, detail="Device not found in registry")
        else:
            device = res.data[0]
        
        last_seen = device.get("last_seen")
        is_connected = False
        heartbeat_window_seconds = 15
        try:
            if isinstance(last_seen, str):
                dt = datetime.fromisoformat(last_seen.replace("Z", "+00:00"))
            elif isinstance(last_seen, datetime):
                dt = last_seen
            else:
                dt = None
            if dt:
                if dt.tzinfo is not None:
                    dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
                now = datetime.utcnow()
                if (now - dt).total_seconds() <= heartbeat_window_seconds:
                    is_connected = True
        except Exception:
            pass

        return {
            "connected": is_connected,
            "battery": device.get("battery_level", 0),
            "user_id": device.get("user_id") 
        }
    except Exception as e:
        # If DB query failed (e.g. table missing), check memory (use heartbeat window)
        if device_id in in_memory_devices:
            device = in_memory_devices[device_id]
            last_seen = device.get("last_seen")
            is_connected = False
            try:
                dt = datetime.fromisoformat(str(last_seen).replace("Z", "+00:00"))
                if dt.tzinfo is not None:
                    dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
                now = datetime.utcnow()
                if (now - dt).total_seconds() <= 15:
                    is_connected = True
            except Exception:
                pass
            return {
                "connected": is_connected,
                "battery": device.get("battery_level", 0),
                "user_id": device.get("user_id")
            }
            
        print(f"Error checking status for {device_id}: {e}")
        # Only raise 500 if it's not a 404 we just raised
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/frame/{device_id}")
async def get_frame(device_id: str):
    """Get the latest frame from the device."""
    if device_id not in frame_buffer:
        raise HTTPException(status_code=404, detail="No frame available")
    
    from fastapi.responses import Response
    return Response(content=frame_buffer[device_id], media_type="image/jpeg")

@router.post("/command/{device_id}")
async def send_command(device_id: str, command: dict):
    """Frontend sends a command (e.g., 'SHOW_TEXT') to Glass."""
    if device_id not in command_queue:
        command_queue[device_id] = []
    
    command_queue[device_id].append(command)
    return {"status": "queued"}
