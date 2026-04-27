import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib
import os

print("Loading dataset...")
dataset_path = os.path.join(os.path.dirname(__file__), '..', 'datasets', 'regenerated_landslide_risk_dataset.csv')
df = pd.read_csv(dataset_path)

df.dropna(inplace=True)

print("Preparing data...")
X = df.drop(columns=['Landslide Risk Prediction'])
y = df['Landslide Risk Prediction']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("Training Random Forest model...")
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

predictions = model.predict(X_test)
accuracy = accuracy_score(y_test, predictions)
print(f"Model Accuracy: {accuracy * 100:.2f}%")

model_path = os.path.join(os.path.dirname(__file__), 'landslide_model.pkl')
joblib.dump(model, model_path)
print(f"Model saved to {model_path}")
