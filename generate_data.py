import pandas as pd
import numpy as np
import os

# Configuration
ORIGINAL_DATASET = 'datasets/THESIS - GIS DATA - FLOOD SCENARIOS_UPDATED.csv'
AUGMENTED_DATASET = 'datasets/THESIS_AUGMENTED_100K.csv'
NUM_SAMPLES = 100000

def generate_synthetic_data(n_samples):
    """
    Generate synthetic data with REDUCED distance impact.
    Focus on Rainfall and Water Level as primary risk drivers.
    """
    print(f"Generating {n_samples} synthetic samples (Distance DE-EMPHASIZED)...")
    
    # Rainfall: 0 to 350mm
    rainfall = np.random.gamma(shape=2, scale=15, size=n_samples)
    rainfall = np.clip(rainfall, 0, 350)
    
    # Water Level: 0 to 9000mm (Mixture of normal and flood conditions)
    water_levels = np.concatenate([
        np.random.normal(3000, 800, int(n_samples * 0.6)),  # Normal flow
        np.random.normal(5000, 1000, int(n_samples * 0.25)), # Elevated
        np.random.normal(7000, 1000, int(n_samples * 0.15))  # Flood
    ])
    np.random.shuffle(water_levels)
    water_levels = np.clip(water_levels, 0, 12000)
    
    # Elevation: 0 to 1000m
    elevation = np.random.lognormal(mean=3, sigma=1, size=n_samples)
    elevation = np.clip(elevation, 1, 1000)
    
    # Slope: 0 to 45 degrees
    slope = np.random.exponential(scale=5, size=n_samples)
    slope = np.clip(slope, 0, 45)
    
    # Distance: 0 to 50km (Wider range to match API data)
    distance = np.random.exponential(scale=5000, size=n_samples)
    distance = np.clip(distance, 0, 50000)
    
    # Calculate Risk Logic - RAINFALL & WATER LEVEL FOCUSED
    flood_status = []
    
    print("Calculating flood labels (Rainfall/Water Level PRIMARY)...")
    
    for r, w, e, s, d in zip(rainfall, water_levels, elevation, slope, distance):
        risk_score = 0
        
        # 1. WATER LEVEL - PRIMARY FACTOR (50% weight)
        if w > 7000: risk_score += 50      # Critical flood
        elif w > 5500: risk_score += 40    # Severe
        elif w > 4500: risk_score += 25    # High
        elif w > 3500: risk_score += 10    # Elevated
        
        # 2. RAINFALL - PRIMARY FACTOR (40% weight)
        if r > 150: risk_score += 40       # Catastrophic rain
        elif r > 80: risk_score += 30      # Extreme rain
        elif r > 40: risk_score += 20      # Heavy rain
        elif r > 15: risk_score += 10      # Moderate rain
        
        # 3. TERRAIN - SECONDARY FACTOR (15% weight)
        # Low elevation + Flat slope = Water accumulation
        if e < 10 and s < 2: risk_score += 15
        elif e < 30 and s < 3: risk_score += 8
        elif e < 50: risk_score += 3
        
        # High ground protection (reduces risk)
        if e > 200: risk_score -= 10
        if e > 500: risk_score -= 15
        
        # 4. DISTANCE - ZERO WEIGHT (User Request)
        # Distance is recorded but has NO impact on risk score
        pass # Zero weight logic

        
        # Determine Status
        if risk_score >= 55:
            status = 'Very High'
        elif risk_score >= 35:
            status = 'High'
        elif risk_score >= 15:
            status = 'Medium'
        elif risk_score >= 5:
            status = 'Low'
        else:
            status = 'Very Low'
            
        flood_status.append(status)
        
    # Create DataFrame (WITHOUT DISTANCE)
    df_synthetic = pd.DataFrame({
        'Rainfall': rainfall,
        'Water Level': water_levels,
        'Elevation': elevation,
        'Slope': slope,
        # 'Distance from River': distance,  <-- REMOVED
        'Flood Status': flood_status
    })
    
    return df_synthetic

def main():
    print(f"Creating augmented dataset: {AUGMENTED_DATASET}")
    print("NOTE: Distance column REMOVED entirely!\n")
    
    # 1. Load Original Data
    if os.path.exists(ORIGINAL_DATASET):
        print("Loading original dataset...")
        df_orig = pd.read_csv(ORIGINAL_DATASET)
        print(f"Original samples: {len(df_orig)}")
        # Drop distance from original too
        if 'Distance from River' in df_orig.columns:
            df_orig = df_orig.drop(columns=['Distance from River'])
            print("Dropped 'Distance from River' column from original data.")
    else:
        print("Original dataset not found!")
        df_orig = pd.DataFrame(columns=['Rainfall', 'Water Level', 'Elevation', 'Slope', 'Flood Status'])

    # 2. Generate Synthetic Data
    df_new = generate_synthetic_data(NUM_SAMPLES)
    
    # 3. Combine
    print("Merging datasets...")
    df_final = pd.concat([df_orig, df_new], ignore_index=True)
    
    # 4. Shuffle
    df_final = df_final.sample(frac=1).reset_index(drop=True)
    
    # 5. Save
    print(f"Saving {len(df_final)} samples to {AUGMENTED_DATASET}...")
    df_final.to_csv(AUGMENTED_DATASET, index=False)
    
    print("\n✅ Dataset Generation Complete!")
    print(f"Total Rows: {len(df_final)}")
    print("\nClass Distribution:")
    print(df_final['Flood Status'].value_counts(normalize=True).round(3))

if __name__ == "__main__":
    main()
