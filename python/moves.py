import os
import json
from compare_moves import check_moves

def parse_moves(input_file, output_file):
    """Parse moves from a text file and save to a JSON file."""
    with open(input_file, 'r') as file:
        data = file.read().strip().split('#-------------------------------')

    moves_list = []

    for entry in data:
        if not entry.strip():
            continue
        
        move_data = {}
        lines = entry.strip().split('\n')
        
        for line in lines:
            if '=' in line:
                key, value = line.split('=', 1)
                key = key.strip()
                value = value.strip()
                
                # Special processing for specific fields
                if key in ['Power', 'Accuracy', 'TotalPP', 'Priority', 'EffectChance']:
                    value = int(value)  # Convert to integer
                elif key in ['Flags']:
                    value = value.split(',')  # Convert to list
                # Store the value in the dictionary
                move_data[key] = value

        # Extract the move name from the header
        move_name = lines[0][1:-1]  # Remove brackets
        move_data['Name'] = move_name
        
        moves_list.append(move_data)

    # Write the moves list to a JSON file
    with open(output_file, 'w') as json_file:
        json.dump(moves_list, json_file, indent=4)

def process_moves(game_folders):
    """Process moves for multiple games."""
    for game_folder in game_folders:
        print(f"Processing game: {game_folder}")
        
        moves_txt_file = os.path.join('games', game_folder, 'data', 'moves.txt')
        moves_json_file = os.path.join('games', game_folder, 'data', 'moves.json')
        
        if not os.path.exists(moves_txt_file):
            print(f"Moves file not found for game: {game_folder}")
            continue
        
        # Parse and save moves
        parse_moves(moves_txt_file, moves_json_file)
        
        # Compare moves and check for mismatches
        mismatches = check_moves(moves_txt_file, moves_json_file)
        if mismatches:
            print(f"Mismatches found for game: {game_folder}")
            for mismatch in mismatches:
                move_name, key, txt_value, json_value = mismatch
                print(f"- {move_name}: {key} differs (txt: {txt_value}, json: {json_value})")
        else:
            print(f"No mismatches found for game: {game_folder}")

if __name__ == '__main__':
    # List of game folders
    games = ['vanguard', 'ss2', 'alden']  # Replace with your actual game folder names
    process_moves(games)
