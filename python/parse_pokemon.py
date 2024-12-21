import os
import json
import re

def convert_txt_to_json(input_file, output_file):
    """Convert Pokémon data from TXT to JSON format."""
    with open(input_file, 'r') as file:
        data = file.read().strip().split('#-------------------------------')
    
    pokemon_list = []
    
    for entry in data:
        if not entry.strip():
            continue
        
        pokemon_data = {}
        lines = entry.strip().split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check for InternalName in brackets
            if line.startswith('['):
                match = re.match(r'\[(.*?)\]', line)
                if match:
                    internal_name = match.group(1)
                    if not internal_name.isdigit():  # Ignore numeric IDs
                        pokemon_data['InternalName'] = internal_name
            
            # Parse key-value pairs
            elif '=' in line:
                key, value = line.split('=', 1)
                key = key.strip()
                value = value.strip()
                
                if key == 'InternalName':
                    pokemon_data['InternalName'] = value
                
                elif key == 'Name':
                    value = value.upper()
                    pokemon_data['Name'] = value
                
                elif key == 'Types':
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
        
        if 'InternalName' not in pokemon_data:
            print(f"Warning: No InternalName found for entry: {pokemon_data.get('Name', 'UNKNOWN')}")
        
        pokemon_list.append(pokemon_data)
    
    # Write to JSON file
    with open(output_file, 'w') as json_file:
        json.dump(pokemon_list, json_file, indent=4)

def process_pokemon_data(game_folders):
    """Process Pokémon data for multiple games."""
    for game_folder in game_folders:
        print(f"Processing game: {game_folder}")
        
        pokemon_txt_file = os.path.join('games', game_folder, 'data', 'pokemon.txt')
        pokemon_json_file = os.path.join('games', game_folder, 'data', 'pokemon.json')
        
        if not os.path.exists(pokemon_txt_file):
            print(f"Pokémon file not found for game: {game_folder}")
            continue
        
        # Convert TXT to JSON
        convert_txt_to_json(pokemon_txt_file, pokemon_json_file)
        print(f"Pokémon data converted for game: {game_folder}")

if __name__ == '__main__':
    # List of game folders
    games = ['vanguard', 'ss2']  # Replace with your actual game folder names
    process_pokemon_data(games)
