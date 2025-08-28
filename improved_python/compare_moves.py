import json
import re

def normalize_name(name):
    """Normalize the name by stripping spaces and converting to lowercase."""
    return re.sub(r'[^a-z0-9]', '', name.strip().lower())

def normalize_value(value):
    """Normalize the value for comparison by stripping spaces and special characters."""
    if isinstance(value, list):
        return sorted([normalize_name(v) for v in value])  # Normalize list items
    elif isinstance(value, str):
        # Try converting to integer if it represents a number
        if value.isdigit():  # Check if the string can be converted to an integer
            return int(value)
        return normalize_name(value)
    return value  # Return as-is for non-string and non-list values

def load_moves_txt(file_path):
    """Load moves from the txt file and return a dictionary."""
    moves_dict = {}
    with open(file_path, 'r') as file:
        data = file.read().strip().split('#-------------------------------')
    
    for entry in data:
        if not entry.strip():
            continue
        
        move_data = {}
        lines = entry.strip().split('\n')
        move_name = None
        
        for line in lines:
            if '[' in line and ']' in line:
                move_name = normalize_name(line[1:-1])  # Extract move name
                continue
            
            if '=' in line and move_name:
                key, value = line.split('=', 1)
                move_data[key.strip()] = value.strip()
        
        if move_name:
            moves_dict[move_name] = move_data
    
    return moves_dict

def load_moves_json(file_path):
    """Load moves from the JSON file and return a dictionary."""
    with open(file_path, 'r') as json_file:
        return json.load(json_file)

def compare_moves(moves_txt, moves_json):
    """Compare moves from txt and json and return mismatches."""
    mismatches = []

    # Check for mismatches in attributes
    for move_name, txt_attributes in moves_txt.items():
        if move_name in moves_json:
            json_attributes = moves_json[move_name]
            for key, txt_value in txt_attributes.items():
                json_value = json_attributes.get(key)
                
                # Normalize both values for comparison
                normalized_txt_value = normalize_value(txt_value)
                normalized_json_value = normalize_value(json_value)

                if normalized_json_value != normalized_txt_value:
                    mismatches.append((move_name, key, normalized_txt_value, normalized_json_value))
    
    return mismatches

def check_moves(txt_file, json_file):
    """Check moves from txt against json and return mismatches."""
    moves_txt = load_moves_txt(txt_file)
    moves_json = load_moves_json(json_file)
    mismatches = compare_moves(moves_txt, moves_json)
    return mismatches
