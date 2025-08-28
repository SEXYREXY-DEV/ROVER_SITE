import json
import re

def normalize_name(name):
    """Normalize the name by stripping spaces and converting to lowercase."""
    return re.sub(r'[^a-z0-9]', '', name.strip().lower())

def normalize_value(value):
    """Normalize the value for comparison by stripping spaces and special characters."""
    return normalize_name(value) if isinstance(value, str) else value

def load_abilities_txt(file_path):
    """Load abilities from the txt file and return a dictionary."""
    abilities_dict = {}
    with open(file_path, 'r') as file:
        data = file.read().strip().split('#-------------------------------')
    
    for entry in data:
        if not entry.strip():
            continue
        
        ability_data = {}
        lines = entry.strip().split('\n')
        ability_name = None
        
        for line in lines:
            if '[' in line and ']' in line:
                ability_name = normalize_name(line[1:-1])  # Extract ability name
                continue
            
            if '=' in line and ability_name:
                key, value = line.split('=', 1)
                ability_data[key.strip()] = value.strip()
        
        if ability_name:
            abilities_dict[ability_name] = ability_data
    
    return abilities_dict

def load_abilities_json(file_path):
    """Load abilities from the JSON file and return a dictionary."""
    with open(file_path, 'r') as json_file:
        return json.load(json_file)

def compare_abilities(abilities_txt, abilities_json):
    """Compare abilities from txt and json and return mismatches."""
    mismatches = []

    # Check for mismatches in attributes
    for ability_name, txt_attributes in abilities_txt.items():
        if ability_name in abilities_json:
            json_attributes = abilities_json[ability_name]
            for key, txt_value in txt_attributes.items():
                json_value = json_attributes.get(key)
                
                # Normalize both values for comparison
                normalized_txt_value = normalize_value(txt_value)
                normalized_json_value = normalize_value(json_value)

                if normalized_json_value != normalized_txt_value:
                    mismatches.append((ability_name, key, normalized_txt_value, normalized_json_value))
    
    return mismatches

def check_abilities(txt_file, json_file):
    """Check abilities from txt against json and return mismatches."""
    abilities_txt = load_abilities_txt(txt_file)
    abilities_json = load_abilities_json(json_file)
    mismatches = compare_abilities(abilities_txt, abilities_json)
    return mismatches
    

