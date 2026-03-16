import os
import sys
import time
import random
import json
import urllib.request
import urllib.error

# Fix for Windows console Unicode encoding (emojis)
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import SELECTED_FEATURES
from data.preprocess import preprocess

FASTAPI_URL = "http://127.0.0.1:8000/predict"

print("==================================================")
print(" 🛡️ AEGIS LIVE TRAFFIC SIMULATOR")
print("==================================================")
print("Loading dataset for simulation... (this takes a few seconds)")

# Load the test dataset
X_train, X_test, y_train, y_test, scaler, le, df = preprocess(sample=True)

# Inverse transform to get raw values for the API
raw_X_test = scaler.inverse_transform(X_test)
classes = le.classes_

print(f"\n✅ Ready! Loaded {len(raw_X_test)} samples from CIC-IDS2017.")
print("Starting continuous live traffic injection (1 event every 5 seconds)...")
print("Press Ctrl+C to stop.\n")

def simulate_event():
    # Pick a random sample from the test set
    idx = random.randint(0, len(raw_X_test) - 1)
    sample_raw = raw_X_test[idx]
    actual_label = classes[y_test[idx]]
    
    # Map features to a dictionary
    feature_dict = {}
    for i, f in enumerate(SELECTED_FEATURES):
        feature_dict[f] = float(sample_raw[i])
        
    payload = {
        "source_ip": f"{random.randint(10, 204)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 250)}",
        "target_system": random.choice(["public-ingress-01", "db-primary", "auth-gateway", "internal-api", "vpn-endpoint"]),
        "features": feature_dict
    }
    
    print("-" * 50)
    print(f"🚀 Injecting actual [{actual_label.upper()}] network traffic...")
    
    req = urllib.request.Request(
        FASTAPI_URL, 
        data=json.dumps(payload).encode("utf-8"), 
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            result = json.loads(response.read().decode())
            threat_type = result['threat_type']
            severity = result['severity']
            
            # Print the ML engine's decision
            if threat_type == "benign":
                print(f"🟢 ML Prediction : {threat_type.upper()} (Allowed)")
            else:
                print(f"🔴 ML Prediction : {threat_type.upper()} | Severity: {severity}")
                print(f"📡 Action        : Pushing threat to Central Platform API -> Frontend")
                
    except urllib.error.URLError as e:
        print(f"❌ Connection Failed: Is the ML FastAPI server running on port 8000? ({e})")

if __name__ == "__main__":
    try:
        while True:
            simulate_event()
            # Randomize the delay to make it feel more organic (between 4 to 8 seconds)
            time.sleep(random.uniform(4, 8))
    except KeyboardInterrupt:
        print("\n🛑 Simulation stopped.")
