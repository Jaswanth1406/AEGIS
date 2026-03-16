"""
AEGIS AI — SHAP Explainability
Provides feature-level explanations for threat predictions.
"""
import os
import numpy as np
import shap
import joblib
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from config import SELECTED_FEATURES, MODEL_DIR


class ThreatExplainer:
    """SHAP-based explainable AI for threat predictions."""

    def __init__(self):
        self.explainer = None

    def fit(self, model, X_sample: np.ndarray):
        """Create SHAP TreeExplainer from trained XGBoost model."""
        print("  Building SHAP TreeExplainer...")
        self.explainer = shap.TreeExplainer(model)
        print("  ✅ SHAP explainer ready")

    def explain(self, X: np.ndarray, top_n: int = 5) -> list[dict]:
        """
        Generate explanations for predictions.
        Returns top_n contributing features per sample.
        """
        if self.explainer is None:
            raise ValueError("Explainer not fitted. Call fit() first.")

        shap_values = self.explainer.shap_values(X)

        explanations = []
        for i in range(len(X)):
            # For multi-class, shap_values is a list of arrays (one per class)
            if isinstance(shap_values, list):
                # Use the absolute max SHAP across all classes
                abs_shap = np.max([np.abs(sv[i]) for sv in shap_values], axis=0)
            else:
                abs_shap = np.abs(shap_values[i])
                if abs_shap.ndim == 2:
                    # Multi-class numpy array shape is (features, classes)
                    abs_shap = np.max(abs_shap, axis=-1)

            # Get top N feature indices
            top_indices = np.argsort(abs_shap)[-top_n:][::-1]

            features = []
            for idx in top_indices:
                idx_int = int(idx)
                features.append({
                    "feature": SELECTED_FEATURES[idx_int],
                    "importance": round(float(abs_shap[idx_int]), 4),
                })

            explanations.append({
                "top_features": features,
                "total_features_analyzed": len(SELECTED_FEATURES),
            })

        return explanations

    def save(self):
        path = os.path.join(MODEL_DIR, "shap_explainer.joblib")
        joblib.dump(self.explainer, path)
        print(f"  💾 Saved SHAP explainer → {path}")

    def load(self):
        path = os.path.join(MODEL_DIR, "shap_explainer.joblib")
        self.explainer = joblib.load(path)
        print(f"  📂 Loaded SHAP explainer ← {path}")
