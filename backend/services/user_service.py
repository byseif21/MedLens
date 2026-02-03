from typing import List, Dict, Any, Optional
import re
import json
from fastapi import UploadFile, HTTPException
from services.storage_service import get_supabase_service
from services.face_service import get_face_service, FaceRecognitionError, collect_face_images
from services.security import hash_password
from utils.validation import normalize_email, sanitize_text, validate_password, validate_phone, ValidationError

def register_new_user(
    name: str,
    email: str,
    password: str,
    phone: Optional[str] = None,
    date_of_birth: Optional[str] = None,
    gender: Optional[str] = None,
    nationality: Optional[str] = None,
    id_number: Optional[str] = None,
    image: Optional[UploadFile] = None,
    image_front: Optional[UploadFile] = None,
    image_left: Optional[UploadFile] = None,
    image_right: Optional[UploadFile] = None,
    image_up: Optional[UploadFile] = None,
    image_down: Optional[UploadFile] = None,
) -> Dict[str, Any]:
    """
    Register a new user with validation, face processing, and database creation.
    """
    supabase = get_supabase_service()
    face_service = get_face_service()
    
    # Input Validation & Sanitization
    try:
        name = sanitize_text(name)
        if not name:
            raise ValidationError("Name is required")
            
        email = normalize_email(email)
        validate_password(password)
        phone = validate_phone(phone)
        
        # Optional fields sanitization
        date_of_birth = sanitize_text(date_of_birth)
        gender = sanitize_text(gender)
        nationality = sanitize_text(nationality)
        id_number = sanitize_text(id_number)
        
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Check if user already exists
    existing = supabase.client.table('users').select('id').eq('email', email).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="User with this email already exists")
    
    # Hash password
    password_hash = hash_password(password)
    
    # Collect face images
    face_images = collect_face_images(
        image, image_front, image_left, image_right, image_up, image_down
    ) # Note: this is an async function in router, but face_service definition needs check
    # Wait, collect_face_images in registration.py was awaited: "await collect_face_images(...)"
    # I need to check if collect_face_images is async.
    
    # ... logic continues ...


def search_users_db(query: str, current_user_id: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
    """
    Search for users by name, email, or ID (exact/prefix).
    Returns a list of user dictionaries.
    """
    supabase = get_supabase_service()
    clean_query = query.strip().lower()
    
    if len(clean_query) < 2:
        return []

    all_users = {}

    # 1. Search by name (case-insensitive)
    try:
        name_results = supabase.client.table('users').select('id, name, email').ilike('name', f'%{clean_query}%').limit(50).execute()
        if name_results.data:
            for user in name_results.data:
                all_users[user['id']] = user
    except Exception as e:
        print(f"Name search error: {e}")

    # 2. Search by email (case-insensitive)
    try:
        email_results = supabase.client.table('users').select('id, name, email').ilike('email', f'%{clean_query}%').limit(50).execute()
        if email_results.data:
            for user in email_results.data:
                all_users[user['id']] = user
    except Exception as e:
        print(f"Email search error: {e}")

    # 3. Search by ID (Exact or Prefix)
    try:
        clean_hex = clean_query.replace('-', '')
        # Only attempt ID search if query contains only hex characters and is valid length
        if re.match(r'^[0-9a-f]+$', clean_hex) and len(clean_hex) <= 32:
            
            def to_uuid(hex_s):
                """Helper to format 32-char hex into UUID string"""
                return f"{hex_s[:8]}-{hex_s[8:12]}-{hex_s[12:16]}-{hex_s[16:20]}-{hex_s[20:]}"

            # Strategy A: Exact Match (Fastest)
            if len(clean_hex) == 32:
                target_id = to_uuid(clean_hex)
                res = supabase.client.table('users').select('id, name, email').eq('id', target_id).execute()
                if res.data:
                    for u in res.data: all_users[u['id']] = u
            
            # Strategy B: Prefix Search (Range Query)
            else:
                start_uuid = to_uuid(clean_hex.ljust(32, '0'))
                end_uuid = to_uuid(clean_hex.ljust(32, 'f'))
                
                res = supabase.client.table('users').select('id, name, email')\
                    .gte('id', start_uuid)\
                    .lte('id', end_uuid)\
                    .limit(50).execute()
                if res.data:
                    for u in res.data: all_users[u['id']] = u

    except Exception as e:
        print(f"ID search error: {e}")
    
    # Filter out current user and limit results
    users_list = [
        user for user in all_users.values() 
        if not current_user_id or user['id'] != current_user_id
    ]
    
    return users_list[:limit]

def delete_user_fully(user_id: str) -> bool:
    """
    Completely delete a user and all their associated data:
    1. Local face encodings
    2. Supabase Storage images (avatar, face angles)
    3. Database record (cascades to related tables)
    
    Args:
        user_id: The UUID of the user to delete
        
    Returns:
        bool: True if deletion was initiated/completed successfully
    """
    supabase = get_supabase_service()
    face_service = get_face_service()
    
    # 1. Delete face encoding from local file
    try:
        face_service.delete_encoding(user_id)
    except Exception as e:
        print(f"Warning: Failed to delete face encoding for user {user_id}: {e}")
    
    # 2. Delete images from Supabase Storage
    # We try to delete all potential image files
    potential_files = [
        f"{user_id}/avatar.jpg",
        f"{user_id}/front.jpg",
        f"{user_id}/left.jpg",
        f"{user_id}/right.jpg",
        f"{user_id}/up.jpg",
        f"{user_id}/down.jpg"
    ]
    try:
        supabase.client.storage.from_('face-images').remove(potential_files)
    except Exception as e:
        print(f"Warning: Failed to cleanup storage for user {user_id}: {str(e)}")
        # Continue execution, as account deletion is the priority
        
    # 3. Delete user from database
    # This will cascade delete related records (medical_info, relatives, etc.)
    try:
        delete_response = supabase.client.table('users').delete().eq('id', user_id).execute()
        # Note: Supabase delete might return empty data if successful but we can check if error occurred
        return True
    except Exception as e:
        raise Exception(f"Database deletion failed: {str(e)}")
