"""
AEGIS AI — Model Evaluation
Computes accuracy, precision, recall, F1, and confusion matrix.
"""
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
)


def evaluate_model(y_true: np.ndarray, y_pred: np.ndarray, class_names: list[str]) -> dict:
    """Evaluate model performance with comprehensive metrics."""
    accuracy = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred, average="weighted", zero_division=0)
    recall = recall_score(y_true, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_true, y_pred, average="weighted", zero_division=0)
    cm = confusion_matrix(y_true, y_pred)

    print("\n" + "=" * 60)
    print("📊 MODEL EVALUATION RESULTS")
    print("=" * 60)
    print(f"  Accuracy:  {accuracy:.4f}")
    print(f"  Precision: {precision:.4f}")
    print(f"  Recall:    {recall:.4f}")
    print(f"  F1 Score:  {f1:.4f}")
    print()

    # Full classification report
    print("─" * 60)
    unique_labels = np.unique(np.concatenate((y_true, y_pred)))
    target_names = [class_names[i] for i in unique_labels]
    report = classification_report(y_true, y_pred, labels=unique_labels, target_names=target_names, zero_division=0)
    print(report)
    print("─" * 60)

    # Confusion matrix
    print("\nConfusion Matrix:")
    # Header
    header = "          " + "  ".join([f"{c[:6]:>6}" for c in target_names])
    print(header)
    for i, row in enumerate(cm):
        row_str = f"{target_names[i][:8]:>8}  " + "  ".join([f"{v:>6}" for v in row])
        print(row_str)
    print()

    return {
        "accuracy": round(accuracy, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
        "confusion_matrix": cm.tolist(),
    }


def evaluate_anomaly_detector(y_true: np.ndarray, anomaly_labels: np.ndarray) -> dict:
    """Evaluate anomaly detector: benign (0) vs anomaly (1)."""
    # Convert: benign class = 0, everything else = 1
    y_binary = (y_true != 0).astype(int)
    anomaly_binary = anomaly_labels.astype(int)

    accuracy = accuracy_score(y_binary, anomaly_binary)
    precision = precision_score(y_binary, anomaly_binary, zero_division=0)
    recall = recall_score(y_binary, anomaly_binary, zero_division=0)
    f1 = f1_score(y_binary, anomaly_binary, zero_division=0)

    print("\n" + "=" * 60)
    print("🔍 ANOMALY DETECTOR EVALUATION")
    print("=" * 60)
    print(f"  Accuracy:  {accuracy:.4f}")
    print(f"  Precision: {precision:.4f}")
    print(f"  Recall:    {recall:.4f}")
    print(f"  F1 Score:  {f1:.4f}")
    print()

    return {
        "accuracy": round(accuracy, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
    }
