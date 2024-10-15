import pandas as pd

# Load the Excel file
df = pd.read_excel('pokedexCEL.xlsx')

# Convert to JSON
json_data = df.to_json(orient='records')

# Save to a file
with open('pokedex.json', 'w') as f:
    f.write(json_data)

print("Excel data has been converted to JSON!")