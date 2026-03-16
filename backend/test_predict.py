import os
import sys
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pipeline.inference import InferencePipeline

pipeline = InferencePipeline()
pipeline.load_models()

test_payload = {
  "source_ip": "203.0.113.45",
  "target_system": "public-web-server",
  "features": {
    "Destination Port": 80,
    "Flow Duration": 98000000,
    "Total Fwd Packets": 105000,
    "Total Backward Packets": 500,
    "Total Length of Fwd Packets": 850000,
    "Total Length of Bwd Packets": 32000,
    "Fwd Packet Length Mean": 8.0,
    "Fwd Packet Length Std": 0.1,
    "Bwd Packet Length Mean": 64.0,
    "Bwd Packet Length Std": 5.0,
    "Flow Bytes/s": 9000.0,
    "Flow Packets/s": 1076.0,
    "Flow IAT Mean": 930.0,
    "Flow IAT Std": 20.0,
    "Fwd IAT Mean": 940.0,
    "Bwd IAT Mean": 190000.0,
    "Packet Length Mean": 9.0,
    "Packet Length Std": 2.0,
    "Average Packet Size": 9.5,
    "Active Mean": 5000000.0
  }
}

print("Running pipeline.predict()...")
result = pipeline.predict(test_payload["features"])
print(f"Result: {result}")
