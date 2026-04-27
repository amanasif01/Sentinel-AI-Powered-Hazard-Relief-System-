import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import joblib
import os

# --- Configuration ---
DATASET_PATH = 'datasets/THESIS_AUGMENTED_100K.csv'
MODEL_DIR = 'models'
MODEL_PATH = os.path.join(MODEL_DIR, 'flood_rf_model.pkl')

# Ensure models directory exists
os.makedirs(MODEL_DIR, exist_ok=True)

def load_and_preprocess_data():
    """Load ONLY the THESIS dataset without synthetic augmentation"""
    print("="*80)
    print("LOADING THESIS DATASET (NO SYNTHETIC DATA)".center(80))
    print("="*80)
    
    try:
        df = pd.read_csv(DATASET_PATH)
    except FileNotFoundError:
        print(f"❌ Error: Dataset not found at {DATASET_PATH}")
        return None, None

    print(f"\n📊 Original Dataset Size: {len(df)} samples")
    
    # Drop rows where target is missing
    df = df.dropna(subset=['Flood Status'])
    
    # Fill numerical missing values with median
    numerical_cols = ['Rainfall', 'Water Level', 'Elevation', 'Slope']
    for col in numerical_cols:
        df[col] = df[col].fillna(df[col].median())

    print(f"\n📈 Dataset Statistics:")
    print(df[numerical_cols].describe())
    
    print(f"\n🎯 Flood Status Distribution:")
    status_counts = df['Flood Status'].value_counts()
    for status, count in status_counts.items():
        percentage = (count / len(df)) * 100
        print(f"   {status:12s}: {count:6d} ({percentage:5.2f}%)")

    # Feature Selection - REMOVING 'Distance from River' as per user request
    features = ['Rainfall', 'Water Level', 'Elevation', 'Slope']
    X = df[features]
    y = df['Flood Status']

    return X, y

def train_with_regularization(X, y):
    """Train Random Forest with regularization to prevent overfitting"""
    print("\n" + "="*80)
    print("TRAINING WITH REGULARIZATION".center(80))
    print("="*80)
    
    # Split data
    print(f"\n📦 Splitting data (80% train, 20% test)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"   Training set: {len(X_train):,} samples")
    print(f"   Test set:     {len(X_test):,} samples")

    # Train with regularization parameters
    print(f"\n🤖 Training Random Forest with regularization...")
    print(f"   Parameters to prevent overfitting:")
    print(f"   - n_estimators: 200 (more trees for stability)")
    print(f"   - max_depth: 15 (limit tree depth)")
    print(f"   - min_samples_split: 20 (require more samples to split)")
    print(f"   - min_samples_leaf: 10 (require more samples in leaves)")
    print(f"   - max_features: 'sqrt' (reduce correlation between trees)")
    print(f"   - class_weight: 'balanced' (handle class imbalance)")
    
    model = RandomForestClassifier(
        n_estimators=200,           # More trees
        max_depth=15,                # Prevent deep trees (overfitting)
        min_samples_split=20,        # Need 20+ samples to split
        min_samples_leaf=10,         # Need 10+ samples in leaf
        max_features='sqrt',         # Use sqrt(n_features) per tree
        random_state=42,
        n_jobs=-1,
        class_weight='balanced'      # Handle imbalanced classes
    )
    
    model.fit(X_train, y_train)

    print(f"\n✅ Training complete!")
    
    # Evaluate
    print(f"\n" + "="*80)
    print("MODEL EVALUATION".center(80))
    print("="*80)
    
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)
    
    train_accuracy = accuracy_score(y_train, y_pred_train)
    test_accuracy = accuracy_score(y_test, y_pred_test)
    
    print(f"\n📊 Accuracy Scores:")
    print(f"   Training Accuracy: {train_accuracy:.4f} ({train_accuracy*100:.2f}%)")
    print(f"   Test Accuracy:     {test_accuracy:.4f} ({test_accuracy*100:.2f}%)")
    
    # Check for overfitting
    overfitting_gap = train_accuracy - test_accuracy
    print(f"\n🔍 Overfitting Check:")
    print(f"   Gap (Train - Test): {overfitting_gap:.4f} ({overfitting_gap*100:.2f}%)")
    if overfitting_gap < 0.05:
        print(f"   ✅ GOOD: Minimal overfitting (gap < 5%)")
    elif overfitting_gap < 0.10:
        print(f"   ⚠️  MODERATE: Some overfitting (gap 5-10%)")
    else:
        print(f"   ❌ WARNING: Significant overfitting (gap > 10%)")

    print(f"\n📋 Detailed Classification Report (Test Set):")
    print(classification_report(y_test, y_pred_test))

    print(f"\n🔢 Confusion Matrix (Test Set):")
    cm = confusion_matrix(y_test, y_pred_test)
    print(cm)

    # Feature Importance
    print(f"\n🎯 Feature Importance:")
    importances = model.feature_importances_
    features = X.columns
    feature_importance = sorted(zip(features, importances), key=lambda x: x[1], reverse=True)
    for feat, imp in feature_importance:
        bar = '█' * int(imp * 50)
        print(f"   {feat:25s} [{bar:<50s}] {imp:.4f}")

    return model

def save_model(model):
    """Save trained model"""
    print(f"\n💾 Saving model to {MODEL_PATH}...")
    joblib.dump(model, MODEL_PATH)
    print(f"✅ Model saved successfully!")

def test_model(model):
    """Test model with various scenarios"""
    print(f"\n" + "="*80)
    print("SCENARIO TESTING".center(80))
    print("="*80)
    
    scenarios = [
        {
            'name': 'High Rain + High Water',
            'features': [100.0, 4500.0, 5.0, 1.0],
            'expected': 'High/Very High'
        },
        {
            'name': 'Normal Rain + Normal Water',
            'features': [20.0, 2000.0, 10.0, 2.0],
            'expected': 'Low/Medium'
        },
        {
            'name': 'Low Rain + High Water',
            'features': [5.0, 4000.0, 10.0, 3.0],
            'expected': 'Medium'
        }
    ]
    
    for scenario in scenarios:
        features = [scenario['features']]
        prediction = model.predict(features)[0]
        
        # Get probabilities
        proba = model.predict_proba(features)[0]
        classes = model.classes_
        
        print(f"\n🧪 {scenario['name']}:")
        print(f"   Features: Rain={scenario['features'][0]}, WL={scenario['features'][1]}, " +
              f"Elev={scenario['features'][2]}, Slope={scenario['features'][3]}")
        print(f"   Expected: {scenario['expected']}")
        print(f"   Predicted: {prediction}")
        print(f"   Probabilities:")
        for cls, prob in zip(classes, proba):
            bar = '█' * int(prob * 30)
            print(f"      {cls:12s} [{bar:<30s}] {prob*100:5.1f}%")

if __name__ == "__main__":
    if not os.path.exists('datasets'):
        print("❌ Error: 'datasets' directory not found. Run from project root.")
    else:
        X, y = load_and_preprocess_data()
        if X is not None:
            model = train_with_regularization(X, y)
            save_model(model)
            test_model(model)
            
            print(f"\n" + "="*80)
            print("TRAINING COMPLETE".center(80))
            print("="*80 + "\n")
