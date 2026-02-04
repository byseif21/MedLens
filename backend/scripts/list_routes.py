
import sys
import os

# Add backend directory to path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(backend_dir)

try:
    from main import app
    
    print("\nRegistered Routes:")
    print("-" * 50)
    for route in app.routes:
        if hasattr(route, "path"):
            methods = ", ".join(route.methods) if hasattr(route, "methods") else "ANY"
            print(f"{methods:<20} {route.path}")
    print("-" * 50)
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
