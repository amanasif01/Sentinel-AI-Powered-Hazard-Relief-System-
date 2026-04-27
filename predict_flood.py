import sys
import joblib
import pandas as pd
import os

# Suppress warnings
import warnings
warnings.filterwarnings("ignore")

# Use absolute path relative to this script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, 'models', 'flood_rf_model.pkl')

def predict(rainfall, water_level, elevation, slope, distance):
    try:
        # Load Model
        # In a production app, we would load this once and keep it in memory (e.g. using Flask/FastAPI)
        # For this script-based approach, we load it every time (overhead is acceptable for low traffic)
        if not os.path.exists(MODEL_PATH):
            # Fallback logic if model missing
            if distance < 500 and water_level > 15: print("High"); return
            print("Low"); return

        model = joblib.load(MODEL_PATH)
        
        # Prepare Input
        # Feature order must match training: ['Rainfall', 'Water Level', 'Elevation', 'Slope']
        # NOTE: Model was trained WITHOUT 'Distance from River'
        features = pd.DataFrame([[rainfall, water_level, elevation, slope]], 
                                columns=['Rainfall', 'Water Level', 'Elevation', 'Slope'])
        
        # Predict
        prediction = model.predict(features)[0]
        print(prediction)

    except Exception as e:
        # Fallback on error
        print("Low")
        # print(f"Error: {e}", file=sys.stderr)

if __name__ == "__main__":
    if len(sys.argv) < 6:
        print("Error: Missing arguments")
        sys.exit(1)
        
    r = float(sys.argv[1])
    l = float(sys.argv[2])
    e = float(sys.argv[3])
    s = float(sys.argv[4])
    d = float(sys.argv[5])
    
    predict(r, l, e, s, d)
