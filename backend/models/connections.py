from pydantic import BaseModel
from typing import List, Optional

# Request/Response Models
class CreateLinkedConnectionRequest(BaseModel):
    connected_user_id: str
    relationship: str

class CreateExternalContactRequest(BaseModel):
    name: str
    phone: str
    address: Optional[str] = None
    relationship: str

class CreateExternalContactResponse(BaseModel):
    success: bool
    contact_id: str
    message: str

class LinkedConnectionResponse(BaseModel):
    id: str
    user_id: str
    connected_user_id: str
    relationship: str
    created_at: str

class CreateLinkedConnectionResponse(BaseModel):
    success: bool
    message: str
    request_id: Optional[str] = None
    connection_id: Optional[str] = None  # Added to support direct connection creation response

class ConnectionRequestResponse(BaseModel):
    id: str
    sender_id: str
    sender_name: str
    sender_email: str
    relationship: str
    status: str
    created_at: str

class ConnectedUser(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None

class LinkedConnection(BaseModel):
    id: str
    connected_user: ConnectedUser
    relationship: str
    created_at: str

class ExternalContact(BaseModel):
    id: str
    name: str
    phone: str
    address: Optional[str]
    relationship: str
    created_at: Optional[str]

class GetConnectionsResponse(BaseModel):
    linked_connections: List[LinkedConnection]
    external_contacts: List[ExternalContact]

class UpdateLinkedConnectionRequest(BaseModel):
    relationship: str

class UpdateExternalContactRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    relationship: Optional[str] = None

class UpdateConnectionResponse(BaseModel):
    success: bool
    message: str

class DeleteConnectionResponse(BaseModel):
    success: bool
    message: str
