"""
AEGIS AI — Isolation Forest Anomaly Detection
Trains on benign-only traffic to learn normal behavior baselines.
"""
import os
import numpy as np
from sklearn.ensemble import IsolationForest
import joblib
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from config import IF_CONTAMINATION, IF_N_ESTIMATORS, IF_RANDOM_STATE, MODEL_DIR


class AnomalyDetector:
    """Behavioral baseline model using Isolation Forest."""

    def __init__(self):
        self.model = IsolationForest(
            contamination=IF_CONTAMINATION,
            n_estimators=IF_N_ESTIMATORS,
            random_state=IF_RANDOM_STATE,
            n_jobs=-1,
        )

    def train(self, X_benign: np.ndarray):
        """Train on benign-only data to learn normal behavior."""
        print(f"  Training Isolation Forest on {len(X_benign):,} benign samples...")
        self.model.fit(X_benign)
        print("  ✅ Isolation Forest trained")

    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Returns anomaly scores.
        score < 0 = anomaly, score > 0 = normal
        """
        return self.model.decision_function(X)

    def is_anomaly(self, X: np.ndarray) -> np.ndarray:
        """Returns boolean array: True = anomaly."""
        predictions = self.model.predict(X)
        return predictions == -1

    def save(self):
        path = os.path.join(MODEL_DIR, "isolation_forest.joblib")
        joblib.dump(self.model, path)
        print(f"  💾 Saved Isolation Forest → {path}")

    def load(self):
        path = os.path.join(MODEL_DIR, "isolation_forest.joblib")
        self.model = joblib.load(path)
        print(f"  📂 Loaded Isolation Forest ← {path}")
