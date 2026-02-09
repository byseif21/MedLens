import uvicorn
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import logging
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MockGlass")

app = FastAPI(title="Mock Smart Glass API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def generate_dummy_image():
    """Generates a dummy JPEG image with timestamp."""
    # Create a blank image (gray background)
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    img.fill(100) # Gray
    
    # Add text
    text = f"Mock Glass View: {time.strftime('%H:%M:%S')}"
    cv2.putText(img, text, (50, 240), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
    
    # Draw a face-like circle to simulate a person
    cv2.circle(img, (320, 200), 80, (200, 200, 255), -1)
    
    # Encode to JPEG
    _, buffer = cv2.imencode('.jpg', img)
    return buffer.tobytes()

@app.get("/status")
async def get_status():
    """Simulates the ESP32 status endpoint."""
    return {
        "status": "ok",
        "battery": 92,
        "connected": True
    }

@app.get("/capture")
async def get_capture():
    """Returns a dummy JPEG snapshot."""
    image_bytes = generate_dummy_image()
    return Response(content=image_bytes, media_type="image/jpeg")

@app.post("/display")
async def update_display(data: dict):
    """Receives data to display on the glass."""
    logger.info(f"Received Display Data: {data}")
    return {"success": True}

@app.get("/stream")
async def get_stream():
    """
    Simulates MJPEG stream (simplified). 
    Browsers handle MJPEG natively, but for this mock we just return a static image 
    because implementing full multipart stream in simple FastAPI script is verbose.
    Real ESP32 handles this better.
    """
    image_bytes = generate_dummy_image()
    return Response(content=image_bytes, media_type="image/jpeg")

if __name__ == "__main__":
    print("Starting Mock Smart Glass on http://localhost:8001")
    uvicorn.run(app, host="0.0.0.0", port=8001)
