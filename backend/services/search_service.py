from typing import List, Dict, Any, Optional, Tuple
import re
import uuid
from dataclasses import dataclass
from services.storage_service import get_supabase_service

@dataclass
class UserSearchFilters:
    """Filters for user search."""
    query: Optional[str] = None
    role: Optional[str] = None
    exclude_id: Optional[str] = None
    page: int = 1
    page_size: int = 20

def get_users_paginated(filters: UserSearchFilters) -> Dict[str, Any]:
    """
    Get paginated users list with optional search and role filter.
    Returns: { "users": [...], "total": int }
    """
    supabase = get_supabase_service()
    
    return supabase.search_users(
        query_str=filters.query,
        role=filters.role,
        exclude_id=filters.exclude_id,
        page=filters.page,
        page_size=filters.page_size
    )
