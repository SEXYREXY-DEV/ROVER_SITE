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

txt_file = 'data/moves.txt'
json_file = 'data/moves.json'


if __name__ == '__main__':
    parse_moves('data/moves.txt', 'data/moves.json')
    
    mismatches = check_moves(txt_file, json_file)

    if mismatches:
            for mismatch in mismatches:
                move_name, key, txt_value, json_value = mismatch
                print(f"- {move_name}: {key} differs (txt: {txt_value}, json: {json_value})")
    else:
        print("No mismatches found!")
