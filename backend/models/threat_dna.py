"""
AEGIS AI — Threat DNA Fingerprinting
Generates behavioral fingerprint vectors for attack patterns.
"""
import os
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics.pairwise import cosine_similarity
import joblib
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from config import THREAT_DNA_FEATURES, SELECTED_FEATURES, MODEL_DIR


class ThreatDNA:
    """Threat DNA fingerprint generator and matcher."""

    def __init__(self):
        self.dna_scaler = MinMaxScaler()
        # Indices of DNA features within the selected features
        self.dna_indices = [SELECTED_FEATURES.index(f) for f in THREAT_DNA_FEATURES if f in SELECTED_FEATURES]
        self.known_fingerprints: list[dict] = []

    def fit(self, X: np.ndarray):
        """Fit the DNA scaler on training data."""
        dna_features = X[:, self.dna_indices]
        self.dna_scaler.fit(dna_features)
        print(f"  ✅ Threat DNA scaler fitted on {len(self.dna_indices)} features")

    def generate_fingerprint(self, X: np.ndarray) -> np.ndarray:
        """
        Generate normalized DNA fingerprint vectors.
        Input: feature matrix (N, all_features)
        Output: normalized vectors (N, dna_features)
        """
        dna_features = X[:, self.dna_indices]
        return self.dna_scaler.transform(dna_features)

    def store_fingerprint(self, fingerprint: np.ndarray, label: str, threat_id: str):
        """Store a known threat fingerprint for future matching."""
        self.known_fingerprints.append({
            "vector": fingerprint.flatten(),
            "label": label,
            "threat_id": threat_id,
        })

    def match_similar(self, fingerprint: np.ndarray, threshold: float = 0.85) -> list[dict]:
        """Find known fingerprints similar to the given one."""
        if not self.known_fingerprints:
            return []

        query = fingerprint.reshape(1, -1)
        results = []
        for known in self.known_fingerprints:
            known_vec = known["vector"].reshape(1, -1)
            sim = cosine_similarity(query, known_vec)[0][0]
            if sim >= threshold:
                results.append({
                    "threat_id": known["threat_id"],
                    "label": known["label"],
                    "similarity": round(float(sim), 4),
                })
        return sorted(results, key=lambda x: x["similarity"], reverse=True)

    def save(self):
        path = os.path.join(MODEL_DIR, "threat_dna.joblib")
        joblib.dump({"scaler": self.dna_scaler, "indices": self.dna_indices, "fingerprints": self.known_fingerprints}, path)
        print(f"  💾 Saved Threat DNA → {path}")

    def load(self):
        path = os.path.join(MODEL_DIR, "threat_dna.joblib")
        data = joblib.load(path)
        self.dna_scaler = data["scaler"]
        self.dna_indices = data["indices"]
        self.known_fingerprints = data.get("fingerprints", [])
        print(f"  📂 Loaded Threat DNA ← {path}")
