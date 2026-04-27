import sys
import joblib
import pandas as pd
import os
import json

def predict():
    try:
        model_path = os.path.join(os.path.dirname(__file__), 'landslide_model.pkl')
        
        if not os.path.exists(model_path):
            print(json.dumps({"error": f"Model file not found at {model_path}"}))
            return
            
        model = joblib.load(model_path)
        
        args = sys.argv[1:]
        if len(args) != 5:
            print(json.dumps({"error": f"Expected 5 arguments, got {len(args)}"}))
            return
            
        temp = float(args[0])
        humidity = float(args[1])
        precip = float(args[2])
        soil_moist = float(args[3])
        elev = float(args[4])
        
        input_data = pd.DataFrame(
            [[temp, humidity, precip, soil_moist, elev]], 
            columns=['Temperature (°C)', 'Humidity (%)', 'Precipitation (mm)', 'Soil Moisture (%)', 'Elevation (m)']
        )
        
        prediction = model.predict(input_data)[0]
        proba = model.predict_proba(input_data)[0]
        
        classes = list(model.classes_)
        proba_dict = {str(c): float(p) for c, p in zip(classes, proba)}
        
        result = {
            "prediction": str(prediction),
            "probabilities": proba_dict
        }
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    predict()
