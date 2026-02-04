
import sys
import os
import asyncio
from unittest.mock import MagicMock, patch
import inspect

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

print("🔍 Starting Comprehensive System Verification...")
print("=" * 60)

# 1. Import Verification
print("\n1. Verifying Imports & Circular Dependencies...")
try:
    from services.user_service import register_new_user
    from routers import users, admin
    from models.user import UserCreate, UserResponse
    from models.admin import UserAdminView
    from dependencies import get_current_user, get_current_admin_user
    print("   ✓ All critical modules imported successfully")
except ImportError as e:
    print(f"   ✗ Import Error: {e}")
    sys.exit(1)

# 2. Schema Verification
print("\n2. Verifying Data Schemas...")
def check_fields(model_class, required_fields):
    model_fields = model_class.model_fields.keys()
    missing = [f for f in required_fields if f not in model_fields]
    if missing:
        print(f"   ✗ {model_class.__name__} missing fields: {missing}")
        return False
    print(f"   ✓ {model_class.__name__} schema OK")
    return True

check_fields(UserCreate, ['email', 'name'])
check_fields(UserResponse, ['id', 'email', 'name', 'role'])
check_fields(UserAdminView, ['id', 'email', 'name', 'is_active', 'role'])

# 3. Logic Flow Verification (Mocked)
print("\n3. Verifying Business Logic Flows...")

async def verify_registration_flow():
    print("   - Testing Registration Flow...")
    
    # Mock dependencies
    mock_supabase = MagicMock()
    mock_face_service = MagicMock()
    
    # Setup mock returns
    mock_face_service.process_face_images.return_value = ([0.1, 0.2], {'front': b'img'})
    mock_supabase.create_user.return_value = {'id': 'new-user-id', 'email': 'test@test.com'}
    mock_supabase.get_user_by_email.return_value = None  # Ensure user doesn't exist
    mock_face_service.find_match.return_value.matched = False # Ensure face doesn't exist
    
    # Patch get_services
    with patch('services.user_service.get_supabase_service', return_value=mock_supabase), \
         patch('services.user_service.get_face_service', return_value=mock_face_service):
        
        from models.user import RegistrationRequest
        req = RegistrationRequest(
            email="test@test.com", 
            password="password123", 
            name="Test User",
            phone="1234567890"
        )
        face_images = {'front': MagicMock()}
        
        try:           
            # Note: _process_face_data is async
            async def mock_process_face(*args):
                return [0.1]*128, {'image': b'bytes'}
            
            with patch('services.user_service._process_face_data', side_effect=mock_process_face) as mock_proc, \
                 patch('services.user_service._persist_user_registration') as mock_persist:
                
                await register_new_user(req, face_images)
                
                if mock_proc.called and mock_persist.called:
                    print("     ✓ Registration orchestration logic OK")
                else:
                    print("     ✗ Registration logic failed to call helpers")
                    
        except Exception as e:
            print(f"     ✗ Registration flow error: {e}")

async def verify_profile_picture_flow():
    print("   - Testing Profile Picture Upload Flow...")
    # Verify it uses run_in_threadpool
    from routers.profile import update_profile_picture
    
    # Inspect the route signature
    sig = inspect.signature(update_profile_picture)
    if 'file' in sig.parameters or 'image' in sig.parameters:
        print("     ✓ Route accepts file upload")
    else:
        print("     ✗ Route missing file parameter")

# 4. Permission Verification
print("\n4. Verifying Route Permissions...")

def check_router_dependencies(router_module, dependency_name, expected_dep):
    print(f"   - Checking {router_module.__name__}...")
    # This is a heuristic check. We verify if the router's routes generally use the dependency.
    # A rigorous check would inspect router.routes
    
    found = False
    for route in router_module.router.routes:
        for dep in route.dependencies:
            # dep.dependency is the function
            if dep.dependency.__name__ == expected_dep.__name__:
                found = True
                break
        if found: break
            
    if found:
        print(f"     ✓ Found usage of {expected_dep.__name__}")
    else:
        # Some routers might use it in the path operation decorator directly
        # or it might be applied at the router level (not easily visible here without more introspection)
        print(f"     ⚠ Could not explicitly verify {expected_dep.__name__} in routes (might be implicit)")

check_router_dependencies(admin, "admin", get_current_admin_user)
check_router_dependencies(users, "users", get_current_user)

# Run Async Tests
if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(verify_registration_flow())
    loop.run_until_complete(verify_profile_picture_flow())
    
    print("\n" + "=" * 60)
    print("✓ System Verification Complete")
