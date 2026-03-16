"""
AEGIS AI — Data Preprocessing
Load CIC-IDS2017 CSVs, clean, normalize, and prepare for training.
"""
import os
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import joblib
import sys

# Fix for Windows console Unicode encoding (emojis)
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from config import (
    DATASET_DIR, DATASET_FILES, SELECTED_FEATURES, LABEL_MAP,
    ATTACK_CLASSES, MODEL_DIR, SAMPLE_SIZE, RANDOM_STATE, TEST_SPLIT,
)


def load_all_csvs() -> pd.DataFrame:
    """Load and concatenate all CIC-IDS2017 CSV files."""
    frames = []
    for fname in DATASET_FILES:
        filepath = os.path.join(DATASET_DIR, fname)
        if not os.path.exists(filepath):
            print(f"  ⚠ Skipping {fname} (not found)")
            continue
        print(f"  Loading {fname}...")
        df = pd.read_csv(filepath, low_memory=False)
        # Strip whitespace from column names
        df.columns = df.columns.str.strip()
        frames.append(df)
    
    combined = pd.concat(frames, ignore_index=True)
    print(f"  Total rows loaded: {len(combined):,}")
    return combined


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Clean the dataset: handle missing/infinite values, select features."""
    # Select features + label
    cols = SELECTED_FEATURES + ["Label"]
    available = [c for c in cols if c in df.columns]
    df = df[available].copy()

    # Replace infinities with NaN
    df.replace([np.inf, -np.inf], np.nan, inplace=True)

    # Drop rows with NaN
    before = len(df)
    df.dropna(inplace=True)
    after = len(df)
    if before != after:
        print(f"  Dropped {before - after:,} rows with NaN/Inf values")

    return df


def map_labels(df: pd.DataFrame) -> pd.DataFrame:
    """Map raw CIC-IDS2017 labels to simplified categories."""
    df["Label"] = df["Label"].str.strip().map(LABEL_MAP)
    # Drop unmapped labels
    before = len(df)
    df.dropna(subset=["Label"], inplace=True)
    after = len(df)
    if before != after:
        print(f"  Dropped {before - after:,} rows with unmapped labels")
    
    print(f"\n  Label distribution:")
    for label, count in df["Label"].value_counts().items():
        print(f"    {label}: {count:,}")
    
    return df


def stratified_sample(df: pd.DataFrame, n: int = SAMPLE_SIZE) -> pd.DataFrame:
    """Take a stratified sample to keep training manageable."""
    if len(df) <= n:
        print(f"  Dataset size ({len(df):,}) <= sample size ({n:,}), using full dataset")
        return df
    
    # Stratified sampling
    sampled_frames = []
    for label, group in df.groupby("Label"):
        size = min(len(group), max(100, int(n * len(group) / len(df))))
        sampled_frames.append(group.sample(n=size, random_state=RANDOM_STATE))
        
    sampled = pd.concat(sampled_frames, ignore_index=True)
    print(f"  Sampled {len(sampled):,} rows (stratified)")
    return sampled


def preprocess(sample: bool = True):
    """Full preprocessing pipeline. Returns X_train, X_test, y_train, y_test, scaler, label_encoder."""
    print("\n🔄 Step 1: Loading CSVs...")
    df = load_all_csvs()

    print("\n🔄 Step 2: Cleaning data...")
    df = clean_data(df)

    print("\n🔄 Step 3: Mapping labels...")
    df = map_labels(df)

    if sample:
        print("\n🔄 Step 4: Stratified sampling...")
        df = stratified_sample(df)

    # Separate features and labels
    X = df[SELECTED_FEATURES].values
    y_raw = df["Label"].values

    # Encode labels
    le = LabelEncoder()
    le.classes_ = np.array(ATTACK_CLASSES)
    y = le.transform(y_raw)

    # Normalize features
    print("\n🔄 Step 5: Normalizing features...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Train/test split
    print("\n🔄 Step 6: Splitting data...")
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=TEST_SPLIT, random_state=RANDOM_STATE, stratify=y
    )
    print(f"  Train: {len(X_train):,}  |  Test: {len(X_test):,}")

    # Save scaler and label encoder
    joblib.dump(scaler, os.path.join(MODEL_DIR, "scaler.joblib"))
    joblib.dump(le, os.path.join(MODEL_DIR, "label_encoder.joblib"))
    print("  ✅ Saved scaler and label encoder")

    return X_train, X_test, y_train, y_test, scaler, le, df


if __name__ == "__main__":
    X_train, X_test, y_train, y_test, scaler, le, df = preprocess()
    print(f"\n✅ Preprocessing complete!")
    print(f"  Features: {len(SELECTED_FEATURES)}")
    print(f"  Classes: {list(le.classes_)}")
