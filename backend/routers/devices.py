from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from services.storage_service import get_supabase_service
from dependencies import get_current_user

router = APIRouter(prefix="/api/devices", tags=["Devices"])

class DevicePairRequest(BaseModel):
    device_id: str
    name: Optional[str] = "My Smart Glass"

class DeviceResponse(BaseModel):
    id: str
    device_id: str
    name: Optional[str]
    status: str
    is_paired: bool
    battery_level: int

@router.get("/", response_model=List[DeviceResponse])
async def get_my_devices(current_user: dict = Depends(get_current_user)):
    """Get all devices paired to the current user."""
    user_id = current_user.get("sub")
    supabase = get_supabase_service()
    
    response = supabase.client.table("devices").select("*").eq("user_id", user_id).execute()
    
    devices = []
    for d in response.data:
        devices.append(DeviceResponse(
            id=d["id"],
            device_id=d["device_id"],
            name=d["name"],
            status=d["status"],
            is_paired=True,
            battery_level=d.get("battery_level", 0)
        ))
    return devices

@router.post("/pair")
async def pair_device(
    request: DevicePairRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Pair a device to the current user.
    Device must exist (synced at least once) and be unclaimed.
    """
    user_id = current_user.get("sub")
    supabase = get_supabase_service()
    
    # Check if device exists
    response = supabase.client.table("devices").select("*").eq("device_id", request.device_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Device not found. Turn it on first.")
    
    device = response.data[0]
    if device.get("user_id"):
        if device["user_id"] == user_id:
            return {"message": "Already paired to you"}
        raise HTTPException(status_code=400, detail="Device already paired to another user")
    
    # Pair it
    update_data = {
        "user_id": user_id,
        "name": request.name,
        "updated_at": "now()"
    }
    supabase.client.table("devices").update(update_data).eq("device_id", request.device_id).execute()
    
    return {"status": "success", "message": f"Device {request.device_id} paired successfully"}

@router.post("/unpair")
async def unpair_device(
    request: DevicePairRequest,
    current_user: dict = Depends(get_current_user)
):
    """Unpair a device from the current user."""
    user_id = current_user.get("sub")
    supabase = get_supabase_service()
    
    # Check ownership
    response = supabase.client.table("devices").select("*").eq("device_id", request.device_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Device not found")
        
    device = response.data[0]
    if device.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="You do not own this device")
    
    # Unpair
    update_data = {
        "user_id": None,
        "name": None,
        "updated_at": "now()"
    }
    supabase.client.table("devices").update(update_data).eq("device_id", request.device_id).execute()
    
    return {"status": "success", "message": "Device unpaired"}
