import os
import sys
import pandas as pd
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import SELECTED_FEATURES
from data.preprocess import preprocess

print("Loading dataset...")
X_train, X_test, y_train, y_test, scaler, le, df = preprocess(sample=True)

# Find a real DDoS sample (class 3 based on earlier output)
classes = le.classes_
print(f"Classes: {classes}")

# Let's find DDoS, PortScan, and Botnet
ddos_idx = list(classes).index('ddos')
portscan_idx = list(classes).index('port_scan')

def get_sample(idx_target, name):
    mask = y_test == idx_target
    if sum(mask) > 0:
        sample_scaled = X_test[mask][0]
        # X_test is scaled! We need raw features!
        # Wait, the pipeline scaler inversing would work:
        sample_raw = scaler.inverse_transform([sample_scaled])[0]
        
        # Build dict
        feature_dict = {}
        for i, f in enumerate(SELECTED_FEATURES):
            feature_dict[f] = float(sample_raw[i])
            
        payload = {
            "source_ip": "192.168.1.10",
            "target_system": "web-server",
            "features": feature_dict
        }
        
        with open(f"sample_{name}.json", "w") as f:
            json.dump(payload, f, indent=2)
        print(f"Saved true {name} payload.")

get_sample(ddos_idx, "ddos")
get_sample(portscan_idx, "portscan")
