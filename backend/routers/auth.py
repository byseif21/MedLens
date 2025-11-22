from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional
import bcrypt
import jwt
from datetime import datetime, timedelta
from services.storage_service import get_supabase_service
from services.face_service import get_face_service
from utils.config import get_config

router = APIRouter(prefix="/api", tags=["authentication"])
security = HTTPBearer()
settings = get_config()

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    user_id: str
    name: str
    email: str
    token: str
    message: str

def create_access_token(data: dict):
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

@router.post("/login", response_model=LoginResponse)
async def login(credentials: LoginRequest):
    """
    Traditional email/password login
    """
    supabase = get_supabase_service()
    
    try:
        # Get user by email
        response = supabase.client.table('users').select('*').eq('email', credentials.email).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        user = response.data[0]
        
        # Verify password
        if not verify_password(credentials.password, user['password_hash']):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Create access token
        token = create_access_token({"sub": user['id'], "email": user['email']})
        
        return LoginResponse(
            user_id=user['id'],
            name=user['name'],
            email=user['email'],
            token=token,
            message="Login successful"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@router.post("/login/face")
async def login_with_face(image: UploadFile = File(...)):
    """
    Face ID login - authenticate user by face recognition
    """
    supabase = get_supabase_service()
    face_service = get_face_service()
    
    try:
        # Read and process image
        image_data = await image.read()
        
        # Extract face encoding from uploaded image
        result = face_service.extract_encoding(image_data)
        
        if not result.success or result.encoding is None:
            error_msg = result.error or "No face detected in the image"
            raise HTTPException(status_code=400, detail=error_msg)
        
        # Use face service to find match
        match_result = face_service.find_match(result.encoding)
        
        if not match_result.matched or match_result.user_id is None:
            raise HTTPException(
                status_code=404, 
                detail="Face not recognized. Please try again or use email login."
            )
        
        # Get user details from database
        response = supabase.client.table('users').select('id, name, email').eq('id', match_result.user_id).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = response.data[0]
        
        # Create access token
        token = create_access_token({"sub": user['id'], "email": user['email']})
        
        return {
            "user_id": user['id'],
            "name": user['name'],
            "email": user['email'],
            "token": token,
            "confidence": match_result.confidence,
            "message": "Face authentication successful"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face login failed: {str(e)}")

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verify JWT token and return current user
    """
    try:
        token = credentials.credentials
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
