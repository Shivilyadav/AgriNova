import requests
import random
import time

URL = "http://localhost:8007/api/sensor"
DEVICE_ID = "ESP32-Virtual-Simulator"

print(f"🚀 Starting AgriNova Sensor Simulation...")
print(f"📡 Sending data to: {URL}")

try:
    while True:
        data = {
            "temperature": round(random.uniform(22.0, 32.0), 1),
            "humidity": round(random.uniform(40.0, 85.0), 1),
            "soil_moisture": random.randint(300, 800), # Analog range
            "light": round(random.uniform(20.0, 95.0), 1),
            "device_id": DEVICE_ID
        }
        
        try:
            res = requests.post(URL, json=data, timeout=5)
            if res.status_code == 200:
                print(f"✅ Data Sent: T={data['temperature']}°C, H={data['humidity']}% | Status: {res.status_code}")
            else:
                print(f"❌ Error: {res.status_code}")
        except Exception as e:
            print(f"❌ Connection Failed: {e}")
            
        time.sleep(3)
except KeyboardInterrupt:
    print("\n👋 Simulation stopped.")
