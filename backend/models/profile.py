from typing import List, Optional
from pydantic import BaseModel, field_validator
from utils.validation import sanitize_text, validate_phone

class DeleteAccountRequest(BaseModel):
    password: str

class PrivacySettingsUpdate(BaseModel):
    is_name_public: Optional[bool] = None
    is_id_number_public: Optional[bool] = None
    is_phone_public: Optional[bool] = None
    is_email_public: Optional[bool] = None
    is_dob_public: Optional[bool] = None
    is_gender_public: Optional[bool] = None
    is_nationality_public: Optional[bool] = None

class MainInfoUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    nationality: Optional[str] = None
    gender: Optional[str] = None
    id_number: Optional[str] = None

    @field_validator('name', 'date_of_birth', 'nationality', 'gender', 'id_number')
    @classmethod
    def validate_text_fields(cls, v):
        return sanitize_text(v)

    @field_validator('phone')
    @classmethod
    def validate_phone_field(cls, v):
        return validate_phone(v)

class MedicalInfoUpdate(BaseModel):
    health_history: Optional[str] = None
    chronic_conditions: Optional[str] = None
    allergies: Optional[str] = None
    current_medications: Optional[str] = None
    previous_surgeries: Optional[str] = None
    emergency_notes: Optional[str] = None
    is_critical: Optional[bool] = None
    
    @field_validator('*')
    @classmethod
    def validate_text_fields(cls, v):
        # We can sanitize all text fields here
        if isinstance(v, str):
            return sanitize_text(v)
        return v

class Relative(BaseModel):
    id: Optional[int] = None
    name: str
    relation: str
    phone: str
    address: Optional[str] = None

    @field_validator('name', 'relation', 'address')
    @classmethod
    def validate_text_fields(cls, v):
        return sanitize_text(v)

    @field_validator('phone')
    @classmethod
    def validate_phone_field(cls, v):
        return validate_phone(v)

class RelativesUpdate(BaseModel):
    relatives: List[Relative]
