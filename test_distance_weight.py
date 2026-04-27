import joblib
import pandas as pd

m = joblib.load('models/flood_rf_model.pkl')

tests = [
    ('High Rain+Water, FAR 10km', [80, 6000, 10, 2, 10000]),
    ('Low Rain+Water, CLOSE 100m', [5, 2000, 10, 2, 100]),
    ('High Rain+Water, CLOSE 100m', [80, 6000, 10, 2, 100]),
    ('Islamabad-like (0 rain, 2000 WL, 10km)', [0, 2000, 500, 2, 10000]),
    ('Moderate Rain, High Water, 5km', [30, 5000, 50, 3, 5000]),
]

print("=" * 60)
print("DISTANCE WEIGHT TEST - Model should prioritize Rain/Water")
print("=" * 60)

for name, features in tests:
    df = pd.DataFrame([features], columns=['Rainfall', 'Water Level', 'Elevation', 'Slope', 'Distance from River'])
    pred = m.predict(df)[0]
    proba = m.predict_proba(df)[0]
    classes = m.classes_
    
    print(f"\n{name}")
    print(f"  Rain={features[0]}, WL={features[1]}, Dist={features[4]/1000}km")
    print(f"  Prediction: {pred}")

print("\n" + "=" * 60)
