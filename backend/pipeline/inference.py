"""
AEGIS AI — Full Inference Pipeline
Chains anomaly detection → classification → fingerprinting → explanation.
"""
import os
import numpy as np
import joblib
import sys

# Fix for Windows console Unicode encoding (emojis)
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from config import MODEL_DIR, SELECTED_FEATURES, ATTACK_CLASSES
from models.baseline import AnomalyDetector
from models.classifier import ThreatClassifier
from models.threat_dna import ThreatDNA
from models.explainer import ThreatExplainer


class InferencePipeline:
    """Complete threat detection inference pipeline."""

    def __init__(self):
        self.scaler = None
        self.anomaly_detector = AnomalyDetector()
        self.classifier = ThreatClassifier()
        self.threat_dna = ThreatDNA()
        self.explainer = ThreatExplainer()

    def load_models(self):
        """Load all saved models."""
        print("📂 Loading models...")
        self.scaler = joblib.load(os.path.join(MODEL_DIR, "scaler.joblib"))
        self.anomaly_detector.load()
        self.classifier.load()
        self.threat_dna.load()
        self.explainer.fit(self.classifier.model, None)  # TreeExplainer doesn't need data
        print("✅ All models loaded\n")

    def predict(self, raw_features: dict, source_ip: str = "127.0.0.1", target_system: str = "unknown") -> dict:
        """
        Run full inference on a single sample.
        Input: dict with feature names → values
        Output: complete threat event
        """
        # Build feature vector
        feature_vector = np.array([[raw_features.get(f, 0) for f in SELECTED_FEATURES]])

        # Scale features
        X_scaled = self.scaler.transform(feature_vector)

        # Step 1: Anomaly detection
        # We invert the score so that HIGHER = MORE ANOMALOUS
        raw_score = float(self.anomaly_detector.predict(X_scaled)[0])
        anomaly_score = -raw_score 
        
        # Apply a manual threshold to classify as threat (e.g., > 0.0 means anomaly)
        # You can tune this threshold (e.g., to 0.1) to be stricter about what is a threat.
        THRESHOLD = 0.0
        is_anomaly = anomaly_score > THRESHOLD

        if is_anomaly:
            # Step 2: Classify threat type
            classification = self.classifier.predict_with_confidence(X_scaled)[0]
            threat_type = classification["attack_type"]
            confidence = classification["confidence"]

            # Severity mapping
            if threat_type in ["botnet", "infiltration"]:
                severity = "CRITICAL"
            elif threat_type in ["ddos", "web_attack", "brute_force"]:
                severity = "HIGH"
            elif threat_type in ["port_scan"]:
                severity = "MEDIUM"
            else:
                severity = "LOW"

            # Step 3: Generate threat fingerprint
            fingerprint = self.threat_dna.generate_fingerprint(X_scaled)

            # Step 5: Generate explanation
            explanation_list = self.explainer.explain(X_scaled, top_n=5)[0]["top_features"]
            explanation_dict = {item["feature"]: item["importance"] for item in explanation_list}

            # Build shap_values array for frontend
            shap_values = [{"feature": item["feature"], "value": item["importance"]} for item in explanation_list]

            return {
                "threat_type": threat_type,
                "severity": severity,
                "source_ip": source_ip,
                "target_system": target_system,
                "confidence_score": confidence,
                "anomaly_score": round(anomaly_score, 4),
                "explanation": explanation_dict,
                "shap_values": shap_values,
                "threat_fingerprint": fingerprint.flatten().tolist()
            }
        else:
            # Still generate SHAP values for benign traffic
            fingerprint = self.threat_dna.generate_fingerprint(X_scaled)
            explanation_list = self.explainer.explain(X_scaled, top_n=5)[0]["top_features"]
            explanation_dict = {item["feature"]: item["importance"] for item in explanation_list}
            shap_values = [{"feature": item["feature"], "value": item["importance"]} for item in explanation_list]

            return {
                "threat_type": "Benign",
                "severity": "LOW",
                "source_ip": source_ip,
                "target_system": target_system,
                "confidence_score": 1.0,
                "anomaly_score": round(anomaly_score, 4),
                "explanation": explanation_dict,
                "shap_values": shap_values,
                "threat_fingerprint": fingerprint.flatten().tolist()
            }

    def predict_batch(self, X_raw: np.ndarray, source_ips: list[str] = None, target_systems: list[str] = None) -> list[dict]:
        """Run inference on a batch of samples (already feature-aligned)."""
        X_scaled = self.scaler.transform(X_raw)

        # Anomaly detection (Invert scores to make higher = anomalous)
        raw_scores = self.anomaly_detector.predict(X_scaled)
        anomaly_scores = -raw_scores
        
        THRESHOLD = 0.0
        is_anomaly = anomaly_scores > THRESHOLD

        # Classification (for all — filter anomalies in results)
        classifications = self.classifier.predict_with_confidence(X_scaled)
        
        # Explanations
        explanations = self.explainer.explain(X_scaled, top_n=5)

        results = []
        for i in range(len(X_scaled)):
            src_ip = source_ips[i] if source_ips else "127.0.0.1"
            tgt_sys = target_systems[i] if target_systems else "unknown"
            
            if is_anomaly[i]:
                threat_type = classifications[i]["attack_type"]
                
                if threat_type in ["botnet", "infiltration"]:
                    severity = "CRITICAL"
                elif threat_type in ["ddos", "web_attack", "brute_force"]:
                    severity = "HIGH"
                elif threat_type in ["port_scan"]:
                    severity = "MEDIUM"
                else:
                    severity = "LOW"
                    
                fp = self.threat_dna.generate_fingerprint(X_scaled[i:i+1])
                exp_dict = {item["feature"]: item["importance"] for item in explanations[i]["top_features"]}
                shap_vals = [{"feature": item["feature"], "value": item["importance"]} for item in explanations[i]["top_features"]]
                
                results.append({
                    "threat_type": threat_type,
                    "severity": severity,
                    "source_ip": src_ip,
                    "target_system": tgt_sys,
                    "confidence_score": classifications[i]["confidence"],
                    "anomaly_score": round(float(anomaly_scores[i]), 4),
                    "explanation": exp_dict,
                    "shap_values": shap_vals,
                    "threat_fingerprint": fp.flatten().tolist()
                })
            else:
                fp = self.threat_dna.generate_fingerprint(X_scaled[i:i+1])
                exp_dict = {item["feature"]: item["importance"] for item in explanations[i]["top_features"]}
                shap_vals = [{"feature": item["feature"], "value": item["importance"]} for item in explanations[i]["top_features"]]
                results.append({
                    "threat_type": "Benign",
                    "severity": "LOW",
                    "source_ip": src_ip,
                    "target_system": tgt_sys,
                    "confidence_score": 1.0,
                    "anomaly_score": round(float(anomaly_scores[i]), 4),
                    "explanation": exp_dict,
                    "shap_values": shap_vals,
                    "threat_fingerprint": fp.flatten().tolist()
                })

        return results
