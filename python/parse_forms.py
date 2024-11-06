import json

def load_base_pokemon_data(base_file):
    """Load the base Pokémon data into a dictionary."""
    with open(base_file, 'r') as file:
        data = file.read().strip().split('#-------------------------------')
    
    base_pokemon = {}
    
    for entry in data:
        if not entry.strip():
            continue
        
        pokemon_data = {}
        lines = entry.strip().split('\n')
        
        for line in lines:
            if '=' in line:
                key, value = line.split('=', 1)
                key = key.strip()
                value = value.strip()
                
                if key == 'Types':
                    # Split Types field into Type1 and Type2
                    types = value.split(',')
                    pokemon_data['Type1'] = types[0]
                    if len(types) > 1:
                        pokemon_data['Type2'] = types[1]
                
                elif key in ['BaseStats', 'EffortPoints', 'Moves', 'TutorMoves', 'EggMoves']:
                    value = value.split(',')
                
                elif key in ['Height', 'Weight']:
                    value = float(value)
                
                elif key in ['BaseEXP', 'Rareness', 'Happiness', 'Generation']:
                    value = int(value)
                
                pokemon_data[key] = value
        
        internal_name = pokemon_data.get('InternalName')
        if internal_name:
            base_pokemon[internal_name] = pokemon_data
    
    return base_pokemon

def convert_forms_to_json(forms_file, base_pokemon, output_file):
    """Convert the forms data to JSON, merging with base Pokémon data."""
    with open(forms_file, 'r') as file:
        data = file.read().strip().split('#-------------------------------')
    
    forms_list = []
    
    for entry in data:
        if not entry.strip():
            continue
        
        form_data = {}
        lines = entry.strip().split('\n')
        base_pokemon_key = None
        
        for line in lines:
            if '[' in line and ']' in line:
                base_pokemon_key = line.split(',')[0][1:]  # Extract the base Pokémon key
                continue
            
            if '=' in line:
                key, value = line.split('=', 1)
                key = key.strip()
                value = value.strip()
                
                if key == 'Types':
                    # Split Types field into Type1 and Type2
                    types = value.split(',')
                    form_data['Type1'] = types[0]
                    if len(types) > 1:
                        form_data['Type2'] = types[1]
                
                elif key in ['BaseStats', 'Moves', 'TutorMoves', 'EggMoves']:
                    value = value.split(',')
                
                elif key in ['Height', 'Weight']:
                    value = float(value)
                
                elif key in ['Generation']:
                    value = int(value)
                
                form_data[key] = value
        
        # Merge missing data from base Pokémon
        if base_pokemon_key in base_pokemon:
            base_data = base_pokemon[base_pokemon_key]
            for key in base_data:
                if key not in form_data:
                    form_data[key] = base_data[key]
        
        forms_list.append(form_data)
    
    # Write to JSON file
    with open(output_file, 'w') as json_file:
        json.dump(forms_list, json_file, indent=4)

# Load base Pokémon data from pokemon.txt
base_pokemon_data = load_base_pokemon_data('data/pokemon.txt')

# Convert the forms data to JSON
convert_forms_to_json('data/pokemon_forms.txt', base_pokemon_data, 'data/pokemon_forms.json')
