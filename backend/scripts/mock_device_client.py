import httpx
import time

# Configuration
BACKEND_URL = "http://localhost:8000" # Change to your prod URL if needed
DEVICE_ID = "mock_glass_001"
BATTERY_LEVEL = 85

def device_loop():
    print(f"Starting Mock Device {DEVICE_ID}...")
    print(f"Connecting to Backend: {BACKEND_URL}")
    
    while True:
        try:
            # Simulate heartbeat / sync
            # In a real device, this would also upload an image if one was captured
            payload = {
                "device_id": DEVICE_ID,
                "battery": BATTERY_LEVEL
            }
            
            # Send heartbeat
            # Use httpx.post instead of requests.post
            with httpx.Client() as client:
                response = client.post(f"{BACKEND_URL}/api/glass/sync", data=payload)
            
            if response.status_code == 200:
                data = response.json()
                print(f"[{time.strftime('%H:%M:%S')}] Heartbeat OK. Commands: {len(data.get('commands', []))}")
                
                # Process commands
                for cmd in data.get("commands", []):
                    print(f" >> EXECUTING COMMAND: {cmd}")
            else:
                print(f"[{time.strftime('%H:%M:%S')}] Heartbeat Failed: {response.status_code} {response.text}")
                
        except Exception as e:
            print(f"Connection Error: {e}")
            
        time.sleep(2) # Send heartbeat every 2 seconds

if __name__ == "__main__":
    try:
        device_loop()
    except KeyboardInterrupt:
        print("\nStopping Mock Device...")
