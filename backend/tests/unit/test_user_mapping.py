
import sys
import os
# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from datetime import datetime

# Import models
from models.user import UserResponse
from models.admin import UserAdminView, UserUpdateRequest

def print_test(name, result):
    print(f"[{'PASS' if result else 'FAIL'}] {name}")

def test_manual_verification():
    print("=== Manual Verification Simulation ===\n")

    # 1. Simulate DB Record (Active User)
    db_record_active = {
        'id': '123',
        'name': 'Test User',
        'email': 'active@test.com',
        'role': 'user',
        'is_active': True,
        'created_at': '2023-01-01T00:00:00Z',
        'last_login': None,
        'phone': None,
        'image_url': None
    }

    # 2. Simulate DB Record (Inactive User)
    db_record_inactive = {
        'id': '456',
        'name': 'Banned User',
        'email': 'banned@test.com',
        'role': 'user',
        'is_active': False,
        'created_at': '2023-01-01T00:00:00Z',
        'last_login': None,
        'phone': None,
        'image_url': None
    }

    # Test UserResponse Mapping (used in Login/Profile)
    print("--- Testing UserResponse (Profile/Login) ---")
    
    # Simulate mapping logic from storage_service.py
    def map_to_response(record):
        return UserResponse(
            id=record['id'],
            name=record['name'],
            email=record['email'],
            role=record.get('role', 'user'),
            is_active=record.get('is_active', True),
            phone=record.get('phone'),
            image_url=record.get('image_url'),
            registered_at=datetime.fromisoformat(record['created_at'].replace('Z', '+00:00'))
        )

    user_active = map_to_response(db_record_active)
    user_inactive = map_to_response(db_record_inactive)

    print(f"Active User 'is_active': {user_active.is_active}")
    print_test("Active User is True", user_active.is_active is True)

    print(f"Inactive User 'is_active': {user_inactive.is_active}")
    print_test("Inactive User is False", user_inactive.is_active is False)
    
    if user_inactive.is_active is True:
        print("!!! FAIL: Inactive user showed as Active (The bug you had before)")

    # Test UserAdminView Mapping (used in Admin Dashboard)
    print("\n--- Testing UserAdminView (Admin Dashboard) ---")
    
    # Simulate mapping logic from admin.py
    def map_to_admin_view(record):
        return UserAdminView(
            id=record['id'],
            name=record['name'],
            email=record['email'],
            role=record.get('role', 'user'),
            is_active=record.get('is_active', True),
            created_at=record.get('created_at'),
            last_login=record.get('last_login')
        )

    admin_view_inactive = map_to_admin_view(db_record_inactive)
    print(f"Admin View 'is_active': {admin_view_inactive.is_active}")
    print_test("Admin View reflects False", admin_view_inactive.is_active is False)

    # Test Update Request
    print("\n--- Testing Update Request ---")
    update_req = UserUpdateRequest(is_active=False)
    print(f"Update Request 'is_active': {update_req.is_active}")
    print_test("Can send is_active update", update_req.is_active is False)

if __name__ == "__main__":
    test_manual_verification()
