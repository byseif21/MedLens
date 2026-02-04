
import numpy as np
import cv2
import face_recognition
import dlib

print(f"Numpy version: {np.__version__}")
print(f"OpenCV version: {cv2.__version__}")
print(f"Dlib version: {dlib.__version__}")
print(f"Face Recognition version: {face_recognition.__version__}")

try:
    # Create a dummy image (100x100 RGB)
    image = np.zeros((100, 100, 3), dtype=np.uint8)
    
    # Test OpenCV
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    print("OpenCV operation successful")
    
    # Test Dlib (via face_recognition which uses it)
    # This might fail if ABI is incompatible
    face_locations = face_recognition.face_locations(image)
    print("Face recognition operation successful")
    
except Exception as e:
    print(f"\nCRASHED: {e}")
    import traceback
    traceback.print_exc()
