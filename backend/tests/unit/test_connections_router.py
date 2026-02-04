import asyncio
import sys
import os
from unittest.mock import MagicMock
from fastapi import HTTPException

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from routers.connections import get_all_connections

async def test_router_permission():
    print("Testing get_all_connections permission check...")
    
    mock_service = MagicMock()
    mock_service.get_all_connections = MagicMock(return_value=asyncio.Future())
    mock_service.get_all_connections.return_value.set_result([])

    # Case 1: No user_id provided (defaults to current)
    try:
        await get_all_connections(current_user={"sub": "user1", "role": "user"}, service=mock_service, user_id=None)
        print("Case 1 (Default): PASSED")
    except Exception as e:
        print(f"Case 1 (Default): FAILED - {e}")

    # Case 2: Explicit same user_id
    try:
        await get_all_connections(current_user={"sub": "user1", "role": "user"}, service=mock_service, user_id="user1")
        print("Case 2 (Same User): PASSED")
    except Exception as e:
        print(f"Case 2 (Same User): FAILED - {e}")

    # Case 3: Different user_id
    try:
        await get_all_connections(current_user={"sub": "user1", "role": "user"}, service=mock_service, user_id="user2")
        print("Case 3 (Diff User): FAILED - Should have raised 403")
    except HTTPException as e:
        if e.status_code == 403:
            print("Case 3 (Diff User): PASSED - Caught 403")
        else:
            print(f"Case 3 (Diff User): FAILED - Wrong status code {e.status_code}")
    except Exception as e:
        print(f"Case 3 (Diff User): FAILED - Wrong exception {type(e)}")

if __name__ == "__main__":
    asyncio.run(test_router_permission())
