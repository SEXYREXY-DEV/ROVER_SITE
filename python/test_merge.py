import json

# Load base Pokémon data from base JSON file
with open('games/vanguard/data/pokemon.json', 'r') as base_file:
    base_data = json.load(base_file)

# Load form data from form JSON file
with open('games/vanguard/data/pokemon_forms.json', 'r') as form_file:
    form_data = json.load(form_file)

merged_pokemon = {}

# Check the structure of the base data
print("Base data structure:")
for base_pokemon in base_data:
    print(base_pokemon)  # Print each base entry to check the structure
    break  # Remove this line if you want to print all base entries

# Iterate through base Pokémon data and add to merged_pokemon dictionary
for base_pokemon in base_data:
    try:
        base_name = base_pokemon["InternalName"]
        merged_pokemon[base_name] = base_pokemon
    except KeyError:
        print(f"Warning: 'InternalName' not found in this base entry: {base_pokemon}")

# Iterate through form data and append forms to the corresponding base Pokémon
for form in form_data:
    base_name = form["BaseName"]
    
    if base_name in merged_pokemon:
        # Ensure that BaseStats exists in the form
        if "BaseStats" in form:
            # Create a new entry for the form in the merged Pokémon data
            form_data_copy = form.copy()
            form_data_copy["InternalName"] = f"{base_name}T"  # Use a new InternalName for the form
            merged_pokemon[base_name]["Forms"] = merged_pokemon[base_name].get("Forms", [])
            merged_pokemon[base_name]["Forms"].append(form_data_copy)
        else:
            print(f"Warning: 'BaseStats' not found in form for {base_name} - skipping form.")
    else:
        print(f"Warning: Base name {base_name} not found in base data.")

# Write the merged Pokémon data to a new JSON file
with open('games/vanguard/data/merged_pokemon.json', 'w') as merged_file:
    json.dump(list(merged_pokemon.values()), merged_file, indent=4)

print("Merge completed and saved to merged_pokemon.json")
