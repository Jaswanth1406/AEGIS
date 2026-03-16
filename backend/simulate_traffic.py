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
print("Finding non-benign traffic indices for higher threat density...")

# Pre-calculate indices of malicious traffic so we can force them to appear more often
malicious_indices = [i for i, label in enumerate(y_test) if classes[label].lower() != "benign"]
benign_indices = [i for i, label in enumerate(y_test) if classes[label].lower() == "benign"]

if not malicious_indices:
    print("⚠️ WARNING: No malicious traffic found in the test set! Using all traffic.")
    malicious_indices = list(range(len(raw_X_test)))

print(f"Found {len(malicious_indices)} malicious samples and {len(benign_indices)} benign samples.")
print("Starting continuous live traffic injection (bias towards 80% threats)...")
print("Press Ctrl+C to stop.\n")

def simulate_event():
    # 80% chance to pick a malicious sample, 20% chance for benign (if benign exists)
    if benign_indices and random.random() > 0.8:
        idx = random.choice(benign_indices)
    else:
        idx = random.choice(malicious_indices)
        
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
            if threat_type.lower() == "benign":
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
            # Faster delays: between 1 and 3 seconds
            time.sleep(random.uniform(1, 3))
    except KeyboardInterrupt:
        print("\n🛑 Simulation stopped.")
