import pandas as pd
df = pd.read_csv('datasets/THESIS - GIS DATA - FLOOD SCENARIOS_UPDATED.csv')
print("Water Level Stats:")
print(df['Water Level'].describe())
print("\nUnique Water Levels:")
print(df['Water Level'].unique())
