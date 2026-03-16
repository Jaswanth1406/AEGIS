"""
AEGIS AI — Configuration
Paths, hyperparameters, and feature definitions.
"""
import os

# ─── Paths ───────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "..", "datasets")
MODEL_DIR = os.path.join(BASE_DIR, "saved_models")

os.makedirs(MODEL_DIR, exist_ok=True)

# Dataset files (CIC-IDS2017)
DATASET_FILES = [
    "Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv",
    "Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX.csv",
    "Friday-WorkingHours-Morning.pcap_ISCX.csv",
    "Monday-WorkingHours.pcap_ISCX.csv",
    "Thursday-WorkingHours-Afternoon-Infilteration.pcap_ISCX.csv",
    "Thursday-WorkingHours-Morning-WebAttacks.pcap_ISCX.csv",
    "Tuesday-WorkingHours.pcap_ISCX.csv",
    "Wednesday-workingHours.pcap_ISCX.csv",
]

# ─── Feature Selection ───────────────────────────────
# 20 most discriminative network flow features
SELECTED_FEATURES = [
    "Destination Port",
    "Flow Duration",
    "Total Fwd Packets",
    "Total Backward Packets",
    "Total Length of Fwd Packets",
    "Total Length of Bwd Packets",
    "Fwd Packet Length Mean",
    "Fwd Packet Length Std",
    "Bwd Packet Length Mean",
    "Bwd Packet Length Std",
    "Flow Bytes/s",
    "Flow Packets/s",
    "Flow IAT Mean",
    "Flow IAT Std",
    "Fwd IAT Mean",
    "Bwd IAT Mean",
    "Packet Length Mean",
    "Packet Length Std",
    "Average Packet Size",
    "Active Mean",
]

# ─── Label Mapping ────────────────────────────────────
# Map raw CIC-IDS2017 labels → simplified categories
LABEL_MAP = {
    "BENIGN": "benign",
    "Bot": "botnet",
    "DDoS": "ddos",
    "DoS Hulk": "ddos",
    "DoS GoldenEye": "ddos",
    "DoS slowloris": "ddos",
    "DoS Slowhttptest": "ddos",
    "Heartbleed": "ddos",
    "PortScan": "port_scan",
    "FTP-Patator": "brute_force",
    "SSH-Patator": "brute_force",
    "Web Attack – Brute Force": "web_attack",
    "Web Attack – XSS": "web_attack",
    "Web Attack – Sql Injection": "web_attack",
    "Web Attack \x96 Brute Force": "web_attack",
    "Web Attack \x96 XSS": "web_attack",
    "Web Attack \x96 Sql Injection": "web_attack",
    "Infiltration": "infiltration",
}

ATTACK_CLASSES = ["benign", "botnet", "brute_force", "ddos", "infiltration", "port_scan", "web_attack"]

# ─── Hyperparameters ──────────────────────────────────
# Isolation Forest
IF_CONTAMINATION = 0.05
IF_N_ESTIMATORS = 100
IF_RANDOM_STATE = 42

# XGBoost
XGB_N_ESTIMATORS = 200
XGB_MAX_DEPTH = 8
XGB_LEARNING_RATE = 0.1
XGB_RANDOM_STATE = 42

# Sampling
SAMPLE_SIZE = 300_000  # Stratified sample from full dataset
RANDOM_STATE = 42
TEST_SPLIT = 0.2

# Threat DNA
THREAT_DNA_FEATURES = [
    "Flow Duration",
    "Flow Bytes/s",
    "Packet Length Std",
    "Flow IAT Mean",
    "Active Mean",
    "Total Fwd Packets",
    "Total Backward Packets",
    "Average Packet Size",
]
