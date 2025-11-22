from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List
from services.storage_service import get_supabase_service

router = APIRouter(prefix="/api/users", tags=["users"])

class UserSearchResult(BaseModel):
    id: str
    name: str
    email: str

class UserSearchResponse(BaseModel):
    users: List[UserSearchResult]

@router.get("/search", response_model=UserSearchResponse)
async def search_users(
    q: str = Query(..., min_length=2, description="Search query (name or ID)"),
    current_user_id: str = Query(None, description="Current user ID to exclude from results")
):
    """
    Search for users by name or ID.
    
    - **q**: Search query (minimum 2 characters)
    - **current_user_id**: Optional - ID of current user to exclude from results
    
    Returns up to 20 matching users with id, name, and email only.
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
    
    # Search by ID - fetch all users and filter by first 8 chars of UUID
    try:
        all_users_result = supabase.client.table('users').select('id, name, email').limit(1000).execute()
        if all_users_result.data:
            for user in all_users_result.data:
                # Check if query matches the first 8 characters of the UUID
                if user['id'].lower().startswith(query):
                    all_users[user['id']] = user
    except Exception as e:
        print(f"ID search error: {e}")
    
    # Convert to list
    users_list = list(all_users.values())
    
    # Exclude current user if provided
    if current_user_id:
        users_list = [user for user in users_list if user['id'] != current_user_id]
    
    # Limit to 20 results
    users_list = users_list[:20]
    
    # Convert to response model
    search_results = [
        UserSearchResult(
            id=user['id'],
            name=user['name'],
            email=user['email']
        )
        for user in users_list
    ]
    
    return UserSearchResponse(users=search_results)
