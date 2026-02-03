from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import json
from services.face_service import get_face_service, FaceRecognitionError, upload_face_images, collect_face_images
from services.storage_service import get_supabase_service
from services.security import hash_password
from utils.validation import normalize_email, sanitize_text, validate_password, validate_phone, ValidationError

router = APIRouter(prefix="/api", tags=["registration"])

@router.post("/register")
async def register_user(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    phone: Optional[str] = Form(None),
    date_of_birth: Optional[str] = Form(None),
    gender: Optional[str] = Form(None),
    nationality: Optional[str] = Form(None),
    id_number: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    # Multi-angle images
    image_front: Optional[UploadFile] = File(None),
    image_left: Optional[UploadFile] = File(None),
    image_right: Optional[UploadFile] = File(None),
    image_up: Optional[UploadFile] = File(None),
    image_down: Optional[UploadFile] = File(None),
):
    """
    Register a new user with face image(s) and personal information.
    Supports both single image and multi-angle face capture.
    """
    supabase = get_supabase_service()
    face_service = get_face_service()
    
    try:
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
        face_images = await collect_face_images(
            image, image_front, image_left, image_right, image_up, image_down
        )
        
        if not face_images:
            raise HTTPException(status_code=400, detail="At least one face image is required")
        
        # Process face images to get average encoding
        try:
            avg_encoding = face_service.process_face_images(face_images)
        except FaceRecognitionError as e:
            raise HTTPException(status_code=400, detail=str(e))

        # Check for duplicate face registration
        match_result = face_service.find_match(avg_encoding)
        if match_result.matched:
             raise HTTPException(
                 status_code=409, 
                 detail="This face is already registered to another user."
             )
        
        face_encoding_json = json.dumps(avg_encoding)
        
        # Create user in database
        user_data = {
            "name": name,
            "email": email,
            "phone": phone,
            "password_hash": password_hash,
            "date_of_birth": date_of_birth,
            "gender": gender,
            "nationality": nationality,
            "id_number": id_number,
            "face_encoding": face_encoding_json
        }
        
        response = supabase.client.table('users').insert(user_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create user")
        
        user_id = response.data[0]['id']
        
        # Save encoding to local face service storage for fast matching
        try:
            face_service.save_encoding(
                user_id=user_id,
                encoding=avg_encoding,
                user_data={"name": name, "email": email}
            )
        except Exception as e:
            print(f"Warning: Failed to save encoding to local storage: {str(e)}")
        
        # Upload face images to storage
        upload_face_images(supabase, user_id, face_images)
        
        return {
            "success": True,
            "user_id": user_id,
            "message": "Registration successful"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")
