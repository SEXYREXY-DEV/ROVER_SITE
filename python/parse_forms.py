import json
import os

def load_base_pokemon_data(base_file):
    """Load the base Pokémon data into a dictionary."""
    with open(base_file, 'r') as file:
        data = file.read().strip().split('#-------------------------------')
    
    base_pokemon = {}
    
    for entry in data:
        if not entry.strip():
            continue
        
        pokemon_data = {'BaseName': ''}
        lines = entry.strip().split('\n')
        
        for line in lines:
            if '=' in line:
                key, value = line.split('=', 1)
                key = key.strip()
                value = value.strip()
                
                # Only process implied columns
                if key in ['InternalName', 'Types', 'BaseStats', 'Height', 'Weight']:
                    if key == 'Types':
                        # Split Types field into Type1 and Type2
                        types = value.split(',')
                        pokemon_data['Type1'] = types[0]
                        if len(types) > 1:
                            pokemon_data['Type2'] = types[1]
                    
                    elif key == 'BaseStats':
                        value = value.split(',')
                    
                    elif key in ['Height', 'Weight']:
                        value = float(value)
                    
                    pokemon_data[key] = value
        
        #internal_name = pokemon_data.get('InternalName')
        #if internal_name:
        #    base_pokemon[internal_name] = pokemon_data
    
    return base_pokemon

def convert_forms_to_json(forms_file, base_pokemon, output_file):
    """Convert the forms data to JSON, merging with base Pokémon data."""
    with open(forms_file, 'r') as file:
        data = file.read().strip().split('#-------------------------------')
    
    forms_list = []
    
    for entry in data:
        if not entry.strip():
            continue
        
        form_data = {'BaseName': '', 'FormName': ''}
        lines = entry.strip().split('\n')
        base_pokemon_key = None
        form_number = None
        
        for line in lines:
            if '[' in line and ']' in line:
                # Extract the base Pokémon key and form number
                header = line.strip('[]')
                base_pokemon_key, *form_info = header.split(',')
                form_data['BaseName'] = base_pokemon_key.strip()
                form_number = form_info[0].strip() if form_info else None
                continue
            
            if '=' in line:
                key, value = line.split('=', 1)
                key = key.strip()
                value = value.strip()
                
                # Only process implied columns
                if key == 'FormName':
                    form_data['FormName'] = value
                
                elif key in ['InternalName', 'Types', 'BaseStats', 'Height', 'Weight']:
                    if key == 'Types':
                        # Split Types field into Type1 and Type2
                        types = value.split(',')
                        form_data['Type1'] = types[0]
                        if len(types) > 1:
                            form_data['Type2'] = types[1]
                    
                    elif key == 'BaseStats':
                        value = value.split(',')
                    
                    elif key in ['Height', 'Weight']:
                        value = float(value)
                    
                    form_data[key] = value
        
        # Default the FormName if not explicitly defined
        if not form_data['FormName']:
            form_data['FormName'] = f"{form_data['BaseName']} Form {form_number or ''}".strip()
        
        # Merge missing data from base Pokémon
        if base_pokemon_key in base_pokemon:
            base_data = base_pokemon[base_pokemon_key]
            for key, base_value in base_data.items():
                if key not in form_data:
                    form_data[key] = base_value
        
        forms_list.append(form_data)
    
    # Write to JSON file
    with open(output_file, 'w') as json_file:
        json.dump(forms_list, json_file, indent=4)

# Paths for all three games
games = ['vanguard', 'ss2']

for game in games:
    base_path = f'games/{game}/data/pokemon.txt'
    forms_path = f'games/{game}/data/pokemon_forms.txt'
    output_path = f'games/{game}/data/pokemon_forms.json'
    
    # Load base Pokémon data
    base_pokemon_data = load_base_pokemon_data(base_path)
    
    # Convert the forms data to JSON
    convert_forms_to_json(forms_path, base_pokemon_data, output_path)
