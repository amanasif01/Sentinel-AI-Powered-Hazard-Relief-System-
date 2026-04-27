import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os

# --- Configuration ---
DATASET_PATH = 'datasets/THESIS - GIS DATA - FLOOD SCENARIOS_UPDATED.csv'
MODEL_DIR = 'models'
MODEL_PATH = os.path.join(MODEL_DIR, 'flood_rf_model.pkl')
SCALER_PATH = os.path.join(MODEL_DIR, 'scaler.pkl') # Not strictly needed for RF, but good practice if we switch models

# Ensure models directory exists
os.makedirs(MODEL_DIR, exist_ok=True)

def load_and_preprocess_data():
    print("Loading dataset...")
    try:
        df = pd.read_csv(DATASET_PATH)
    except FileNotFoundError:
        print(f"Error: Dataset not found at {DATASET_PATH}")
        return None, None

    # 1. Basic Cleaning
    # Drop rows where 'Flood Status' (target) is missing
    df = df.dropna(subset=['Flood Status'])
    
    # Fill numerical missing values with median
    numerical_cols = ['Rainfall', 'Water Level', 'Elevation', 'Slope', 'Distance from River']
    for col in numerical_cols:
        df[col] = df[col].fillna(df[col].median())

    print(f"Original Dataset Size: {len(df)}")

    # 2. Data Augmentation (Synthetic Data for Safety Logic)
    # The dataset mostly has short distances (<700m). We need to teach the model
    # that "Very Far" (e.g., >2km) usually means "Low" risk, so it doesn't hallucinate 
    # High risk for distant city centers.
    
    print("Generating synthetic 'Safe' data for large distances...")
    n_synthetic = 2000  # Add 2000 safe points
    
    synthetic_data = {
        'Rainfall': np.random.uniform(df['Rainfall'].min(), df['Rainfall'].max(), n_synthetic),
        'Water Level': np.random.uniform(df['Water Level'].min(), df['Water Level'].max(), n_synthetic),
        'Elevation': np.random.uniform(df['Elevation'].min(), df['Elevation'].max(), n_synthetic),
        'Slope': np.random.uniform(df['Slope'].min(), df['Slope'].max(), n_synthetic),
        'Distance from River': np.random.uniform(2000, 50000, n_synthetic), # 2km to 50km
        'Flood Status': ['Low'] * n_synthetic
    }
    
    df_synthetic = pd.DataFrame(synthetic_data)
    df_combined = pd.concat([df, df_synthetic], ignore_index=True)
    
    print(f"Combined Dataset Size: {len(df_combined)}")

    # 3. Feature Selection & Encoding
    X = df_combined[numerical_cols]
    y = df_combined['Flood Status']

    return X, y

def train_and_evaluate(X, y):
    print("Splitting data...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training Random Forest Classifier...")
    # n_estimators=100: Create 100 trees
    # random_state=42: Reproducibility
    rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
    rf_model.fit(X_train, y_train)

    print("Evaluating model...")
    y_pred = rf_model.predict(X_test)
    
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    # Feature Importance
    print("\nFeature Importance:")
    importances = rf_model.feature_importances_
    features = X.columns
    for feat, imp in zip(features, importances):
        print(f"{feat}: {imp:.4f}")

    return rf_model

def save_model(model):
    print(f"Saving model to {MODEL_PATH}...")
    joblib.dump(model, MODEL_PATH)
    print("Model saved successfully.")

if __name__ == "__main__":
    if not os.path.exists('datasets'):
        print("Error: 'datasets' directory not found. Please run this script from the project root.")
    else:
        X, y = load_and_preprocess_data()
        if X is not None:
            model = train_and_evaluate(X, y)
            save_model(model)
            
            print("\n--- Quick Test ---")
            # Test Case 1: Close to river, High Rain (Should be High/Very High)
            test_close = [[50.0, 4400.0, 10.0, 2.0, 50.0]] # 50m distance
            pred_close = model.predict(test_close)
            print(f"Scenario: Close to River (50m) -> Prediction: {pred_close[0]}")
            
            # Test Case 2: Far from river (Should be Low)
            test_far = [[50.0, 4400.0, 10.0, 2.0, 15000.0]] # 15km distance
            pred_far = model.predict(test_far)
            print(f"Scenario: Far from River (15km) -> Prediction: {pred_far[0]}")
