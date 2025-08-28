import json

# Load JSON data
with open('pokemon_master.json', 'r') as file:
    data = json.load(file)

# Filter for Pokémon with empty 'Evolutions' and include forms
pokemon_with_forms = []
for pokemon in data:
    # Add main form if 'Evolutions' is empty
    if not pokemon.get("Evolutions"):
        base_stats = list(map(int, pokemon["BaseStats"]))
        pokemon_with_forms.append({"Name": pokemon["Name"], "BST": sum(base_stats)})

    # Add each additional form if 'Evolutions' is empty
    for form in pokemon.get("Forms", []):
        if not pokemon.get("Evolutions"):
            form_base_stats = list(map(int, form["BaseStats"]))
            form_name = f"{pokemon['Name']} ({form['FormName']})"
            pokemon_with_forms.append({"Name": form_name, "BST": sum(form_base_stats)})

# Sort by BST in descending order and exclude top 20
pokemon_with_forms_sorted = sorted(pokemon_with_forms, key=lambda x: x["BST"], reverse=True)
pokemon_without_top_20 = pokemon_with_forms_sorted[20:]

# Calculate the average BST of the remaining Pokémon
if pokemon_without_top_20:
    average_bst = sum(p["BST"] for p in pokemon_without_top_20) / len(pokemon_without_top_20)
else:
    average_bst = 0

print(f"Average BST (including forms, excluding top 20 BSTs, and only for Pokémon without evolutions): {average_bst:.2f}")
