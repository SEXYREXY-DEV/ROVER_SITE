import json

def convert_txt_to_json(input_file, output_file):
    with open(input_file, 'r') as file:
        data = file.read().strip().split('#-------------------------------')
    
    pokemon_list = []
    
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
                
                if key == 'Name':
                    value = value.upper()
                
                if key == 'Types':
                    # Split Types field into Type1 and Type2
                    types = value.split(',')
                    pokemon_data['Type1'] = types[0]
                    if len(types) > 1:
                        pokemon_data['Type2'] = types[1]
                
                elif key in ['BaseStats', 'EffortPoints', 'Moves', 'TutorMoves']:
                    # Convert comma-separated values to lists
                    value = value.split(',')
                    pokemon_data[key] = value
                
                elif key in ['Height', 'Weight']:
                    # Convert to float
                    pokemon_data[key] = float(value)
                
                elif key in ['BaseEXP', 'Rareness', 'Happiness', 'Generation']:
                    # Convert to int
                    pokemon_data[key] = int(value)
                
                else:
                    pokemon_data[key] = value
        
        pokemon_list.append(pokemon_data)
    
    # Write to JSON file
    with open(output_file, 'w') as json_file:
        json.dump(pokemon_list, json_file, indent=4)

# Convert the pokemon.txt to pokemon.json
convert_txt_to_json('data/pokemon.txt', 'data/pokemon.json')
