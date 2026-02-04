
import sys
from pathlib import Path

# Add backend directory to python path
# Parent of scripts is backend
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

import io
from PIL import Image

# Mocking services/dependencies to isolate the issue
try:
    import face_recognition
except ImportError:
    print("face_recognition not found")

def create_dummy_face_image():
    # Create a 200x200 RGB image (black)
    # This won't have a face, so face_recognition should return 0 faces
    # We just want to check if it CRASHES
    img = Image.new('RGB', (200, 200), color = 'red')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    return img_byte_arr.getvalue()

def test_face_processing():
    print("Testing face processing...")
    try:
        image_data = create_dummy_face_image()
        image_file = io.BytesIO(image_data)
        
        # Load image using face_recognition
        print("Loading image...")
        image = face_recognition.load_image_file(image_file)
        
        print("Detecting faces...")
        face_locations = face_recognition.face_locations(image)
        print(f"Faces found: {len(face_locations)}")
        
        # Note: We expect 0 faces for a red square, but it shouldn't crash
        
        if len(face_locations) > 0:
            print("Encoding faces...")
            encodings = face_recognition.face_encodings(image, face_locations)
            print(f"Encodings generated: {len(encodings)}")
            
    except Exception as e:
        print(f"❌ Error in face processing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_face_processing()
