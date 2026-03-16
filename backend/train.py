"""
AEGIS AI — Training Script
Orchestrates the full ML pipeline: preprocess → train → evaluate → save.
"""
import os
import sys
import time
import numpy as np

# Fix for Windows console Unicode encoding (emojis)
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import ATTACK_CLASSES, SELECTED_FEATURES
from data.preprocess import preprocess
from models.baseline import AnomalyDetector
from models.classifier import ThreatClassifier
from models.threat_dna import ThreatDNA
from models.explainer import ThreatExplainer
from evaluation.evaluate import evaluate_model, evaluate_anomaly_detector


def train():
    start = time.time()

    print("=" * 60)
    print("🛡️  AEGIS AI — ML Pipeline Training")
    print("=" * 60)

    # ─── Step 1: Preprocess ──────────────────────────────
    X_train, X_test, y_train, y_test, scaler, le, df = preprocess()

    # ─── Step 2: Isolation Forest (Anomaly Detection) ────
    print("\n" + "=" * 60)
    print("🌲 Phase 2: Anomaly Detection (Isolation Forest)")
    print("=" * 60)

    # Train on benign-only data
    benign_mask = y_train == 0  # benign = index 0
    X_benign = X_train[benign_mask]

    anomaly_detector = AnomalyDetector()
    anomaly_detector.train(X_benign)
    anomaly_detector.save()

    # Evaluate anomaly detector
    anomaly_preds = anomaly_detector.is_anomaly(X_test)
    evaluate_anomaly_detector(y_test, anomaly_preds)

    # ─── Step 3: XGBoost (Threat Classification) ─────────
    print("\n" + "=" * 60)
    print("⚡ Phase 3: Threat Classification (XGBoost)")
    print("=" * 60)

    classifier = ThreatClassifier()
    classifier.train(X_train, y_train)
    classifier.save()

    # Evaluate classifier
    y_pred = classifier.predict(X_test)
    eval_results = evaluate_model(y_test, y_pred, ATTACK_CLASSES)

    # ─── Step 4: Threat DNA Fingerprinting ───────────────
    print("\n" + "=" * 60)
    print("🧬 Phase 4: Threat DNA Fingerprinting")
    print("=" * 60)

    threat_dna = ThreatDNA()
    threat_dna.fit(X_train)

    # Generate fingerprints for a few attack samples
    attack_mask = y_train != 0
    if attack_mask.sum() > 0:
        attack_samples = X_train[attack_mask][:10]
        attack_labels = y_train[attack_mask][:10]
        fingerprints = threat_dna.generate_fingerprint(attack_samples)
        for i in range(len(fingerprints)):
            threat_dna.store_fingerprint(
                fingerprints[i],
                ATTACK_CLASSES[attack_labels[i]],
                f"DNA-TRAIN-{i:04d}",
            )
        print(f"  Stored {len(fingerprints)} threat fingerprints")

    threat_dna.save()

    # ─── Step 5: SHAP Explainability ─────────────────────
    print("\n" + "=" * 60)
    print("🧠 Phase 5: Explainable AI (SHAP)")
    print("=" * 60)

    explainer = ThreatExplainer()
    explainer.fit(classifier.model, X_train[:1000])
    explainer.save()

    # Demo explanation on a few test samples
    sample_explanations = explainer.explain(X_test[:3], top_n=5)
    for i, exp in enumerate(sample_explanations):
        pred_class = ATTACK_CLASSES[y_pred[i]]
        print(f"\n  Sample {i+1} (predicted: {pred_class}):")
        for feat in exp["top_features"]:
            bar = "█" * int(feat["importance"] * 20)
            print(f"    {feat['feature']:<30} {feat['importance']:.4f}  {bar}")

    # ─── Summary ─────────────────────────────────────────
    elapsed = time.time() - start
    print("\n" + "=" * 60)
    print("🎉 TRAINING COMPLETE")
    print("=" * 60)
    print(f"  Time elapsed:  {elapsed:.1f}s")
    print(f"  Accuracy:      {eval_results['accuracy']:.4f}")
    print(f"  F1 Score:      {eval_results['f1_score']:.4f}")
    print(f"  Models saved:  backend/saved_models/")
    print(f"  Features:      {len(SELECTED_FEATURES)}")
    print(f"  Classes:       {ATTACK_CLASSES}")
    print()

    return eval_results


if __name__ == "__main__":
    train()
