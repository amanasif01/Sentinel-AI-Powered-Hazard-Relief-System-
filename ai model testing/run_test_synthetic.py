import pandas as pd
import joblib
import os
import sys
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, precision_recall_fscore_support
import numpy as np

# Setup paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'flood_rf_model.pkl')
DATASET_PATH = os.path.join(BASE_DIR, 'datasets', 'THESIS_AUGMENTED_100K.csv')
OUTPUT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'test_results_synthetic.txt')

def main():
    print("Starting AI Model Testing on SYNTHETIC DATASET...")
    
    # 1. Load Model
    if not os.path.exists(MODEL_PATH):
        print(f"Error: Model not found at {MODEL_PATH}")
        return

    print(f"Loading model from: {MODEL_PATH}")
    model = joblib.load(MODEL_PATH)

    # 2. Load Dataset
    if not os.path.exists(DATASET_PATH):
        print(f"Error: Dataset not found at {DATASET_PATH}")
        return

    print(f"Loading dataset from: {DATASET_PATH}")
    df = pd.read_csv(DATASET_PATH)
    
    # 3. Preprocess / Feature Selection
    # Based on predict_flood.py: ['Rainfall', 'Water Level', 'Elevation', 'Slope']
    # User instruction: Ignore Distance from River
    feature_cols = ['Rainfall', 'Water Level', 'Elevation', 'Slope']
    target_col = 'Flood Status'

    # Verify columns exist
    missing_cols = [col for col in feature_cols if col not in df.columns]
    if missing_cols:
        print(f"Error: Missing columns in dataset: {missing_cols}")
        return

    # Check for target column
    if target_col not in df.columns:
        print(f"Error: Target column '{target_col}' not found in dataset.")
        return

    # Handle missing values if any (simple median fill as per training logic)
    for col in feature_cols:
         if df[col].isnull().any():
             print(f"Warning: Missing values found in {col}. Filling with median.")
             df[col] = df[col].fillna(df[col].median())

    df = df.dropna(subset=[target_col])

    X = df[feature_cols]
    y_true = df[target_col]

    print(f"Testing on {len(df)} samples...")

    # 4. Predict
    y_pred = model.predict(X)

    # 5. Calculate Metrics
    accuracy = accuracy_score(y_true, y_pred)
    
    # Get unique classes to ensure we handle all of them
    labels = np.unique(np.concatenate((y_true, y_pred)))
    
    # Classification report (Precision, Recall, F1)
    report = classification_report(y_true, y_pred, digits=4, zero_division=0)
    
    # Confusion Matrix
    cm = confusion_matrix(y_true, y_pred, labels=labels)

    # 6. Generate Report
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write("================================================================\n")
        f.write("          AI MODEL TESTING REPORT (SYNTHETIC DATASET)\n")
        f.write("================================================================\n\n")
        
        f.write(f"Model Path:   {MODEL_PATH}\n")
        f.write(f"Dataset Path: {DATASET_PATH}\n")
        f.write(f"Total Samples: {len(df)}\n\n")
        
        f.write("----------------------------------------------------------------\n")
        f.write(f"OVERALL ACCURACY: {accuracy:.4f} ({accuracy*100:.2f}%)\n")
        f.write("----------------------------------------------------------------\n\n")
        
        f.write("DETAILED METRICS (Precision, Recall, F1-Score):\n")
        f.write(report)
        f.write("\n")
        
        f.write("----------------------------------------------------------------\n")
        f.write("CLASS-WISE ACCURACY & DETAILS\n")
        f.write("----------------------------------------------------------------\n")
        
        for i, label in enumerate(labels):
            # True Positives
            tp = cm[i, i]
            # Total Actual occurrences of this class
            total_actual = np.sum(cm[i, :])
            # Total Predicted as this class
            total_predicted = np.sum(cm[:, i])
            
            class_accuracy = tp / total_actual if total_actual > 0 else 0.0
            
            f.write(f"\nClass: {label}\n")
            f.write(f"  Total Actual:    {total_actual}\n")
            f.write(f"  Total Predicted: {total_predicted}\n")
            f.write(f"  Correctly Pred:  {tp}\n")
            f.write(f"  Accuracy (Recall): {class_accuracy:.4f} ({class_accuracy*100:.2f}%)\n")
            
            # Simple F2 Score calculation
            prec = tp / total_predicted if total_predicted > 0 else 0.0
            rec = class_accuracy
            beta = 2
            if (beta**2 * prec + rec) > 0:
                f2 = (1 + beta**2) * (prec * rec) / ((beta**2 * prec) + rec)
            else:
                f2 = 0.0
            f.write(f"  F2 Score:        {f2:.4f}\n")

        f.write("\n----------------------------------------------------------------\n")
        f.write("CONFUSION MATRIX\n")
        f.write("----------------------------------------------------------------\n")
        f.write("Rows = True Label, Columns = Predicted Label\n\n")
        
        # Header
        col_width = max([len(l) for l in labels] + [10]) + 2
        header = " " * col_width + "".join([l.ljust(col_width) for l in labels])
        f.write(header + "\n")
        
        for i, label_row in enumerate(labels):
            row_str = label_row.ljust(col_width)
            for j in range(len(labels)):
                row_str += str(cm[i, j]).ljust(col_width)
            f.write(row_str + "\n")

    print(f"\n✅ Synthetic Testing Complete!")
    print(f"Results saved to: {OUTPUT_FILE}")
    print(f"Overall Accuracy: {accuracy*100:.2f}%")

if __name__ == "__main__":
    main()
