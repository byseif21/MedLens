
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("health_check")

def check_dependencies():
    print("Checking dependencies...")
    
    # 1. Check face_recognition
    try:
        import face_recognition
        import dlib
        print(f"✅ face_recognition {face_recognition.__version__} installed")
        print(f"✅ dlib {dlib.__version__} installed")
    except ImportError as e:
        print(f"❌ Face recognition dependencies missing: {e}")
    except Exception as e:
        print(f"❌ Error loading face_recognition: {e}")

    # 2. Check numpy
    try:
        import numpy
        print(f"✅ numpy {numpy.__version__} installed")
    except ImportError:
        print("❌ numpy missing")

    # 3. Check PIL
    try:
        import PIL
        print(f"✅ Pillow {PIL.__version__} installed")
    except ImportError:
        print("❌ Pillow missing")

    # 4. Check Supabase
    try:
        import supabase
        print(f"✅ supabase {supabase.__version__} installed")
    except ImportError:
        print("❌ supabase missing")

def check_env_vars():
    print("\nChecking environment variables...")
    from dotenv import load_dotenv
    load_dotenv()
    
    required_vars = ["SUPABASE_URL", "SUPABASE_KEY", "SUPABASE_SERVICE_KEY"]
    for var in required_vars:
        val = os.getenv(var)
        if val:
            print(f"✅ {var} is set")
        else:
            print(f"❌ {var} is MISSING")

if __name__ == "__main__":
    check_dependencies()
    check_env_vars()
