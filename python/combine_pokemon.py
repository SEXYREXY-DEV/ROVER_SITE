import json

# Load the base Pokémon data
with open('data/pokemon.json', 'r') as f:
    pokemon_data = json.load(f)

# Load the forms data
with open('data/pokemon_forms.json', 'r') as f:
    forms_data = json.load(f)

# Organize base Pokémon data by InternalName or Name, skipping entries without either
pokemon_dict = {
    (poke.get('InternalName') or poke.get('Name')): poke
    for poke in pokemon_data if poke.get('InternalName') or poke.get('Name')
}

# Dictionary to keep track of form counts per Pokémon
form_counters = {}

# Process each form and add it to the respective Pokémon's entry
for form in forms_data:
    # Determine the base Pokémon identifier, prioritizing InternalName
    base_internal_name = form.get("InternalName") or form.get("Name")
    
    # Check if the base Pokémon exists in the main data
    if base_internal_name in pokemon_dict:
        # Initialize form counter for this Pokémon if it doesn't exist
        if base_internal_name not in form_counters:
            form_counters[base_internal_name] = 1
        else:
            form_counters[base_internal_name] += 1

        # Create a unique InternalName for this form
        form_internal_name = f"{base_internal_name}_{form_counters[base_internal_name]}"
        
        # Add this unique InternalName to the form under "InternalName" 
        # and right after "FormName" for clarity
        form["FormName"] = form.get("FormName", f"{base_internal_name} Form {form_counters[base_internal_name]}")
        form["InternalName"] = form_internal_name

        # Remove redundant fields from form to avoid duplication with base Pokémon data
        form = {key: value for key, value in form.items() if key not in {"Name", "InternalName"}}
        
        # Ensure Forms field is a list in the main Pokémon dictionary
        if "Forms" not in pokemon_dict[base_internal_name]:
            pokemon_dict[base_internal_name]["Forms"] = []
        
        # Add the form entry to the Forms list in the base Pokémon dictionary
        pokemon_dict[base_internal_name]["Forms"].append({
            "FormName": form["FormName"],
            "InternalName": form_internal_name,
            **form  # Include all remaining fields in the form
        })
    else:
        print(f"Warning: {base_internal_name} in forms file not found in base Pokémon data.")

# Convert the dictionary back to a list
merged_data = list(pokemon_dict.values())

# Save the merged data
with open('data/merged_pokemon.json', 'w') as f:
    json.dump(merged_data, f, indent=4)
