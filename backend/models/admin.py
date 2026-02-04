from typing import List, Optional
from dataclasses import dataclass
from pydantic import BaseModel
from fastapi import Query

@dataclass
class UserListParams:
    page: int = Query(1, ge=1)
    page_size: int = Query(20, ge=1, le=100)
    q: Optional[str] = Query(None, description="Search by name or email")
    role: Optional[str] = Query(None, description="Filter by role")

class UserAdminView(BaseModel):
    id: str
    name: str
    email: str
    role: str
    is_active: bool = True
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
    is_active: Optional[bool] = None
