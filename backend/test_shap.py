import joblib
import numpy as np
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import SELECTED_FEATURES

explainer = joblib.load("saved_models/shap_explainer.joblib")
X_test = np.random.rand(3, len(SELECTED_FEATURES))

shap_values = explainer.shap_values(X_test)
print(f"SHAP values type: {type(shap_values)}")
if isinstance(shap_values, np.ndarray):
    print(f"SHAP values shape: {shap_values.shape}")
elif isinstance(shap_values, list):
    print(f"List length: {len(shap_values)}")
    print(f"Element shape: {shap_values[0].shape}")
