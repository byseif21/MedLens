from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from services.face_service import get_face_service, FaceRecognitionError
from services.user_service import get_complete_user_profile
from utils.config import get_config
from dependencies import get_current_user

router = APIRouter(prefix="/api", tags=["recognition"])
settings = get_config()

@router.post("/recognize")
async def recognize_face(image: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """
    Recognize a person from their face image.
    Returns complete profile if match found.
    """
    face_service = get_face_service()
    
    try:
        # Identify user from image
        match_result = face_service.identify_user(await image.read())
        
        if not match_result.matched or not match_result.user_id:
             return {
                "success": True,
                "match": False,
                "message": "Face not recognized",
                "confidence": match_result.confidence or 0.0
            }

        # Get complete user profile
        current_user_id = (current_user or {}).get("sub")
        role = (current_user or {}).get("role") or "user"
        
        profile = await get_complete_user_profile(match_result.user_id, current_user_id, role)
        
        return {
            "success": True,
            "match": True,
            "confidence": match_result.confidence,
            **profile
        }
    
    except FaceRecognitionError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recognition failed: {str(e)}")
