import pandas as pd
import numpy as np

# Load original data
file_path = "c:/Users/Shivil Yadav/AgriNova/backend/data/crop_data.csv"
df = pd.read_csv(file_path)

print("Original Distribution:")
print(df['label'].value_counts())

# Target number of samples per class
TARGET_COUNT = 10
features = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']

new_rows = []

for crop in df['label'].unique():
    crop_data = df[df['label'] == crop]
    current_count = len(crop_data)
    
    # Add original data
    new_rows.append(crop_data)
    
    if current_count < TARGET_COUNT:
        needed = TARGET_COUNT - current_count
        # Sample with replacement from existing crop data
        sampled_data = crop_data.sample(n=needed, replace=True).copy()
        
        # Add slight random noise (max 2% variation) to avoid exact duplicates
        for feature in features:
            noise = np.random.normal(0, 0.02 * sampled_data[feature].mean(), size=needed)
            sampled_data[feature] += noise
            sampled_data[feature] = sampled_data[feature].round(2)
            
        new_rows.append(sampled_data)

# Combine and shuffle
balanced_df = pd.concat(new_rows, ignore_index=True)
balanced_df = balanced_df.sample(frac=1).reset_index(drop=True)

# Save over original
balanced_df.to_csv(file_path, index=False)

print("\nNew Balanced Distribution:")
print(balanced_df['label'].value_counts())
print("\nDataset successfully balanced and saved!")
