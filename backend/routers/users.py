from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import List, Optional
from services.storage_service import get_supabase_service
from routers.auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])

# --- Admin Endpoints ---

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

def get_current_admin_user(current_user: dict = Depends(get_current_user)):
    role = current_user.get("role")
    if role != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user

@router.get("/admin/list", response_model=AdminUserListResponse)
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
    
    # Start building query
    query_builder = supabase.client.table('users').select('*', count='exact')
    
    if q:
        # Search by name or email
        # Note: Supabase/PostgREST syntax for OR is slightly complex in python client, 
        # usually .or_(f"name.ilike.%{q}%,email.ilike.%{q}%")
        query_builder = query_builder.or_(f"name.ilike.%{q}%,email.ilike.%{q}%")
    
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
                name=u['name'],
                email=u['email'],
                role=u.get('role', 'user'),
                created_at=u.get('created_at'),
                last_login=u.get('last_sign_in_at') # Supabase auth field, might be in separate table but we use 'users' table copy
            ))
            
    return {
        "users": users,
        "total": result.count or 0,
        "page": page,
        "page_size": page_size
    }

@router.delete("/admin/{user_id}")
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
        # Delete from public.users table
        # Note: In a real Supabase setup, you might need to use supabase.auth.admin.delete_user(user_id) 
        # if you are using Supabase Auth. 
        # Assuming we are managing users in our 'users' table:
        
        # Check if user exists
        check = supabase.client.table('users').select('id').eq('id', user_id).execute()
        if not check.data:
            raise HTTPException(status_code=404, detail="User not found")
            
        supabase.client.table('users').delete().eq('id', user_id).execute()
        
        return {"message": "User deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    # Add other fields as needed

@router.put("/admin/{user_id}")
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


class UserSearchResult(BaseModel):
    id: str
    name: str
    email: str
    connection_status: str = "none" # "none", "connected", "pending_sent", "pending_received"

class UserSearchResponse(BaseModel):
    users: List[UserSearchResult]

@router.get("/search", response_model=UserSearchResponse)
async def search_users(
    q: str = Query(..., min_length=2, description="Search query (name or ID)"),
    current_user_id: str = Query(None, description="Current user ID to exclude from results and check status")
):
    """
    Search for users by name or ID.
    
    - **q**: Search query (minimum 2 characters)
    - **current_user_id**: Optional - ID of current user to exclude from results and check connection status
    
    Returns up to 20 matching users with id, name, email, and connection_status.
    """
    supabase = get_supabase_service()
    
    # Validate query length
    if len(q.strip()) < 2:
        raise HTTPException(
            status_code=400, 
            detail="Search query must be at least 2 characters long"
        )
    
    query = q.strip().lower()
    
    all_users = {}
    
    # Search by name (case-insensitive)
    try:
        name_results = supabase.client.table('users').select('id, name, email').ilike('name', f'%{query}%').limit(50).execute()
        if name_results.data:
            for user in name_results.data:
                all_users[user['id']] = user
    except Exception as e:
        print(f"Name search error: {e}")
    
    # Search by email (case-insensitive)
    try:
        email_results = supabase.client.table('users').select('id, name, email').ilike('email', f'%{query}%').limit(50).execute()
        if email_results.data:
            for user in email_results.data:
                all_users[user['id']] = user
    except Exception as e:
        print(f"Email search error: {e}")
    
    # Convert to list and exclude current user
    users_list = [user for user in all_users.values() if not current_user_id or user['id'] != current_user_id]
    
    # Limit to 20 results
    users_list = users_list[:20]
    
    user_statuses = {}
    if current_user_id and users_list:
        try:
            target_ids = [u['id'] for u in users_list]
            connections = (
                supabase.client.table('user_connections')
                .select('connected_user_id')
                .eq('user_id', current_user_id)
                .in_('connected_user_id', target_ids)
                .execute()
            )
            for conn in connections.data or []:
                user_statuses[conn['connected_user_id']] = "connected"

            sent_requests = (
                supabase.client.table('connection_requests')
                .select('receiver_id')
                .eq('sender_id', current_user_id)
                .in_('receiver_id', target_ids)
                .eq('status', 'pending')
                .execute()
            )
            for req in sent_requests.data or []:
                user_statuses[req['receiver_id']] = "pending_sent"

            received_requests = (
                supabase.client.table('connection_requests')
                .select('sender_id')
                .eq('receiver_id', current_user_id)
                .in_('sender_id', target_ids)
                .eq('status', 'pending')
                .execute()
            )
            for req in received_requests.data or []:
                user_statuses.setdefault(req['sender_id'], "pending_received")
        except Exception as e:
            print(f"Error checking connection statuses: {e}")
    
    # Convert to response model
    search_results = [
        UserSearchResult(
            id=user['id'],
            name=user['name'],
            email=user['email'],
            connection_status=user_statuses.get(user['id'], "none")
        )
        for user in users_list
    ]
    
    return UserSearchResponse(users=search_results)
