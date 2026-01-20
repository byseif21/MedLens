from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import List, Optional
import httpx
from services.storage_service import get_supabase_service
from routers.auth import get_current_user
from utils.config import get_config

router = APIRouter(prefix="/api/admin", tags=["admin"])
settings = get_config()

# --- Admin Models ---

class UserAdminView(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: Optional[str] = None
    last_login: Optional[str] = None

class AdminUserListResponse(BaseModel):
    users: List[UserAdminView]
    total: int
    page: int
    page_size: int

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None

# --- Admin Dependencies ---

def get_current_admin_user(current_user: dict = Depends(get_current_user)):
    role = current_user.get("role")
    if role != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user

# --- Admin Endpoints ---

@router.get("/users", response_model=AdminUserListResponse)
async def list_users_admin(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    q: str = Query(None, description="Search by name or email"),
    role: str = Query(None, description="Filter by role"),
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Admin: List all users with pagination and search.
    """
    supabase = get_supabase_service()
    
    # If search query is present, use direct API call for proper OR filtering support
    if q:
        try:
            headers = {
                "apikey": settings.SUPABASE_KEY,
                "Authorization": f"Bearer {settings.SUPABASE_KEY}",
                "Prefer": "count=exact"
            }
            
            # PostgREST parameters
            params = {
                "select": "*",
                "limit": str(page_size),
                "offset": str((page - 1) * page_size),
                "order": "created_at.desc",
                "or": f"(name.ilike.*{q}*,email.ilike.*{q}*)"
            }
            
            if role:
                params["role"] = f"eq.{role}"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{settings.SUPABASE_URL}/rest/v1/users", 
                    headers=headers, 
                    params=params
                )
                
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail=f"Database error: {response.text}")
                
            users_data = response.json()
            
            # Extract total count from Content-Range header (format: 0-24/100)
            content_range = response.headers.get("Content-Range")
            total = int(content_range.split('/')[1]) if content_range and '/' in content_range else len(users_data)
            
            users = []
            for u in users_data:
                users.append(UserAdminView(
                    id=u['id'],
                    name=u.get('name', 'Unknown'),
                    email=u.get('email', 'Unknown'),
                    role=u.get('role', 'user'),
                    created_at=u.get('created_at'),
                    last_login=u.get('last_sign_in_at')
                ))
                
            return {
                "users": users,
                "total": total,
                "page": page,
                "page_size": page_size
            }
            
        except Exception as e:
            print(f"Search error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

    # Standard query using client (when no complex OR filter is needed)
    query_builder = supabase.client.table('users').select('*', count='exact')
    
    if role:
        query_builder = query_builder.eq('role', role)
        
    # Pagination
    start = (page - 1) * page_size
    end = start + page_size - 1
    
    # Execute query
    result = query_builder.range(start, end).order('created_at', desc=True).execute()
    
    users = []
    if result.data:
        for u in result.data:
            users.append(UserAdminView(
                id=u['id'],
                name=u.get('name', 'Unknown'), # Safety get
                email=u.get('email', 'Unknown'),
                role=u.get('role', 'user'),
                created_at=u.get('created_at'),
                last_login=u.get('last_sign_in_at')
            ))
            
    return {
        "users": users,
        "total": result.count or 0,
        "page": page,
        "page_size": page_size
    }

@router.delete("/users/{user_id}")
async def delete_user_admin(
    user_id: str,
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Admin: Delete a user.
    """
    supabase = get_supabase_service()
    
    # Prevent deleting self
    if user_id == current_user['sub']:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
    
    try:
        # Check if user exists
        check = supabase.client.table('users').select('id').eq('id', user_id).execute()
        if not check.data:
            raise HTTPException(status_code=404, detail="User not found")
            
        supabase.client.table('users').delete().eq('id', user_id).execute()
        
        return {"message": "User deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")

@router.put("/users/{user_id}")
async def update_user_admin(
    user_id: str,
    update_data: UserUpdateRequest,
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Admin: Update user details (e.g. role).
    """
    supabase = get_supabase_service()
    
    data_to_update = {k: v for k, v in update_data.dict().items() if v is not None}
    
    if not data_to_update:
        raise HTTPException(status_code=400, detail="No data provided for update")
        
    try:
        result = supabase.client.table('users').update(data_to_update).eq('id', user_id).execute()
        if not result.data:
             raise HTTPException(status_code=404, detail="User not found or update failed")
             
        return {"message": "User updated successfully", "user": result.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update user: {str(e)}")
