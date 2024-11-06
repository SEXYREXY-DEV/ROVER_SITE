import json
import re
from compare_abilities import check_abilities

def normalize_name(name):
    """Normalize the name by stripping spaces and converting to lowercase."""
    return re.sub(r'[^a-z0-9]', '', name.strip().lower())

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

def save_abilities_to_json(abilities_dict, output_file):
    """Save the abilities dictionary to a JSON file."""
    with open(output_file, 'w') as json_file:
        json.dump(abilities_dict, json_file, indent=4)

def parse_abilities(input_file, output_file):
    """Parse the abilities from the txt file and save them to a JSON file."""
    abilities_dict = load_abilities_txt(input_file)
    save_abilities_to_json(abilities_dict, output_file)
    
abilities_txt_file = 'data/abilities.txt'
abilities_json_file = 'data/abilities.json'

if __name__ == '__main__':
    parse_abilities('data/abilities.txt', 'data/abilities.json')
    ability_mismatches = check_abilities(abilities_txt_file, abilities_json_file) 
    if ability_mismatches:
        for mismatch in ability_mismatches:
            ability_name, key, txt_value, json_value = mismatch
            print(f"- {ability_name}: {key} differs (txt: {txt_value}, json: {json_value})")
    else:
        print("No ability mismatches found!")
