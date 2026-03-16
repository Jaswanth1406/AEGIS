"""
AEGIS AI — XGBoost Threat Classifier
Classifies detected anomalies into specific attack categories.
"""
import os
import numpy as np
from xgboost import XGBClassifier
import joblib
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from config import XGB_N_ESTIMATORS, XGB_MAX_DEPTH, XGB_LEARNING_RATE, XGB_RANDOM_STATE, MODEL_DIR, ATTACK_CLASSES


class ThreatClassifier:
    """Multi-class threat classifier using XGBoost."""

    def __init__(self):
        self.model = XGBClassifier(
            n_estimators=XGB_N_ESTIMATORS,
            max_depth=XGB_MAX_DEPTH,
            learning_rate=XGB_LEARNING_RATE,
            random_state=XGB_RANDOM_STATE,
            eval_metric="mlogloss",
            n_jobs=-1,
            tree_method="hist",
        )

    def train(self, X_train: np.ndarray, y_train: np.ndarray):
        """Train the classifier on labeled data."""
        print(f"  Training XGBoost on {len(X_train):,} samples, {len(ATTACK_CLASSES)} classes...")
        self.model.fit(X_train, y_train)
        print("  ✅ XGBoost trained")

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Returns predicted class indices."""
        return self.model.predict(X)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Returns class probabilities."""
        return self.model.predict_proba(X)

    def predict_with_confidence(self, X: np.ndarray) -> list[dict]:
        """Returns attack type and confidence for each sample."""
        preds = self.model.predict(X)
        probs = self.model.predict_proba(X)
        results = []
        for i in range(len(preds)):
            results.append({
                "attack_type": ATTACK_CLASSES[preds[i]],
                "confidence": round(float(probs[i].max()), 4),
            })
        return results

    def save(self):
        path = os.path.join(MODEL_DIR, "xgboost_classifier.joblib")
        joblib.dump(self.model, path)
        print(f"  💾 Saved XGBoost → {path}")

    def load(self):
        path = os.path.join(MODEL_DIR, "xgboost_classifier.joblib")
        self.model = joblib.load(path)
        print(f"  📂 Loaded XGBoost ← {path}")
