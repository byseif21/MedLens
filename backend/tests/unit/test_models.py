
import sys
import os
# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from datetime import datetime
from models.user import UserResponse
from models.admin import UserAdminView

def test_models():
    # Test UserResponse
    user_data = {
        "id": "123",
        "name": "Test User",
        "email": "test@example.com",
        "role": "admin",
        "is_active": False,
        "registered_at": datetime.now(),
        "phone": "1234567890"
    }
    
    user = UserResponse(**user_data)
    print(f"UserResponse is_active: {user.is_active}")
    print(f"UserResponse role: {user.role}")
    
    assert user.is_active is False
    assert user.role == "admin"

    # Test UserAdminView
    admin_view_data = {
        "id": "123",
        "name": "Test User",
        "email": "test@example.com",
        "role": "user",
        "is_active": False
    }
    
    admin_view = UserAdminView(**admin_view_data)
    print(f"UserAdminView is_active: {admin_view.is_active}")
    assert admin_view.is_active is False
    
    print("All model tests passed!")

if __name__ == "__main__":
    test_models()
