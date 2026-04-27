#!/usr/bin/env python
"""
Manual Flood Risk Tester
Interactive tool to test the AI model with custom inputs
Supports CLI args: python manual_flood_test.py [rainfall] [water_level] [elevation] [slope] [distance]
"""

import os
import sys
import joblib
import pandas as pd

# Path to trained model
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, 'models', 'flood_rf_model.pkl')

def print_header():
    print("\n" + "="*80)
    print("🌊 FLOOD RISK PREDICTION - MANUAL TESTER 🌊".center(80))
    print("="*80 + "\n")

def get_float_input(prompt, default=None):
    """Get validated float input from user"""
    while True:
        try:
            if default is not None:
                user_input = input(f"{prompt} (default: {default}): ").strip()
                if not user_input:
                    return float(default)
            else:
                user_input = input(f"{prompt}: ").strip()
            
            return float(user_input)
        except ValueError:
            print("❌ Invalid input. Please enter a valid number.")

def get_user_input():
    """Interactive input gathering"""
    print_header()
    print("Enter the following parameters to get a flood risk prediction:\n")
    
    # Get inputs from user
    print("📊 PARAMETER 1: Rainfall")
    print("   (Total recent rainfall in millimeters, e.g., 0-100)")
    rainfall = get_float_input("   Enter Rainfall (mm)", default=0)
    
    print("\n💧 PARAMETER 2: Water Level")
    print("   (Current water level in millimeters, typically 1000-5000)")
    water_level = get_float_input("   Enter Water Level (mm)", default=4000)
    
    print("\n🏔️ PARAMETER 3: Elevation")
    print("   (Ground elevation in meters, e.g., 0-500)")
    elevation = get_float_input("   Enter Elevation (m)", default=10)
    
    print("\n📐 PARAMETER 4: Slope")
    print("   (Terrain slope in degrees, typically 0-10)")
    slope = get_float_input("   Enter Slope (degrees)", default=2)
    
    # Distance removed as per user request
    
    return rainfall, water_level, elevation, slope

def predict_flood_risk(rainfall, water_level, elevation, slope):
    """Core prediction logic"""
    
    # Check if model exists
    if not os.path.exists(MODEL_PATH):
        print(f"❌ ERROR: Model not found at {MODEL_PATH}")
        print("Please train the model first by running: python train_model.py")
        sys.exit(1)
    
    # Display inputs
    print("\n" + "-"*80)
    print("📋 INPUT PARAMETERS:")
    print("-"*80)
    print(f"  Rainfall:           {rainfall:.2f} mm")
    print(f"  Water Level:        {water_level:.2f} mm")
    print(f"  Elevation:          {elevation:.2f} m")
    print(f"  Slope:              {slope:.2f}°")
    print("-"*80)
    
    # Load model and predict
    try:
        print("\n🤖 Loading AI Model...")
        model = joblib.load(MODEL_PATH)
        
        print("🔮 Making Prediction...")
        
        # Prepare features in correct order
        features = pd.DataFrame(
            [[rainfall, water_level, elevation, slope]], 
            columns=['Rainfall', 'Water Level', 'Elevation', 'Slope']
        )
        
        # Get prediction
        prediction = model.predict(features)[0]
        
        # Get prediction probabilities if available
        try:
            probabilities = model.predict_proba(features)[0]
            class_names = model.classes_
        except:
            probabilities = None
            class_names = None
        
        # Display result
        print("\n" + "="*80)
        print("🎯 PREDICTION RESULT".center(80))
        print("="*80 + "\n")
        
        # Color-coded output
        risk_colors = {
            'Low': '🟢',
            'Medium': '🟡',
            'High': '🔴',
            'Very High': '🔴🔴',
            'Critical': '⚠️'
        }
        
        icon = risk_colors.get(prediction, '⚪')
        
        print(f"   {icon} FLOOD RISK: {prediction.upper()} {icon}\n")
        
        # Risk interpretation
        interpretations = {
            'Low': 'Minimal flood risk. Conditions are safe.',
            'Medium': 'Moderate flood risk. Monitor conditions and stay alert.',
            'High': 'Significant flood risk. Take precautionary measures.',
            'Very High': 'Critical flood risk. Evacuate if advised by authorities.',
            'Critical': 'IMMEDIATE DANGER. Evacuate immediately!'
        }
        
        print(f"   Interpretation: {interpretations.get(prediction, 'Unknown risk level')}")
        
        # Show probabilities if available
        if probabilities is not None and class_names is not None:
            print("\n   📊 Confidence Breakdown:")
            for cls, prob in zip(class_names, probabilities):
                bar_length = int(prob * 40)
                bar = '█' * bar_length + '░' * (40 - bar_length)
                print(f"      {cls:12s} [{bar}] {prob*100:5.1f}%")
        
        print("\n" + "="*80 + "\n")
        
    except Exception as e:
        print(f"\n❌ ERROR during prediction: {str(e)}")
        sys.exit(1)

def main():
    """Main program loop"""
    
    # Check for CLI arguments
    if len(sys.argv) >= 5:
        try:
            r = float(sys.argv[1])
            w = float(sys.argv[2])
            e = float(sys.argv[3])
            s = float(sys.argv[4])
            # Ignore 5th arg (distance) if provided, to be compatible
            
            predict_flood_risk(r, w, e, s)
            return
        except ValueError:
            print("❌ Invalid CLI arguments. Expecting numbers.")
            sys.exit(1)

    # Interactive mode
    while True:
        r, w, e, s = get_user_input()
        predict_flood_risk(r, w, e, s)
        
        # Ask if user wants to test again
        again = input("Would you like to test another scenario? (y/n): ").strip().lower()
        if again not in ['y', 'yes']:
            print("\n👋 Thank you for using the Flood Risk Predictor!")
            print("="*80 + "\n")
            break

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Program interrupted by user.")
        print("="*80 + "\n")
        sys.exit(0)
