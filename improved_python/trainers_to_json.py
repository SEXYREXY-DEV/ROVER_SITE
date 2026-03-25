import os
import json
import re

class TrainersParser:
    def __init__(self):
        pass

    def convert_txt_to_json(self, input_file, output_file):
        """Convert trainer data from TXT to JSON format."""
        with open(input_file, 'r', encoding='utf-8') as file:
            content = file.read()
        
        sections = content.strip().split('#-------------------------------')
        
        trainers_list = []
        
        for section in sections:
            if not section.strip():
                continue
            
            trainer_data = self._parse_trainer_section(section.strip())
            if trainer_data:
                trainers_list.append(trainer_data)
        
        with open(output_file, 'w', encoding='utf-8') as json_file:
            json.dump(trainers_list, json_file, indent=4, ensure_ascii=False)

    def _parse_trainer_section(self, section):
        """Parse a single trainer section."""
        lines = section.split('\n')
        trainer = {}
        pokemon_list = []
        current_pokemon = None
        
        for line in lines:
            line = line.rstrip()
            if not line:
                continue
            
            if line.startswith('[') and line.endswith(']'):
                content = line[1:-1]  # remove [ and ]
                parts = [p.strip() for p in content.split(',')]
                
                if len(parts) >= 2:
                    trainer['Type'] = parts[0]
                    trainer['Name'] = parts[1]
                    
                    if len(parts) >= 3:
                        try:
                            trainer['Number'] = int(parts[2])
                        except ValueError:
                            pass  # ignore if it's not a number
                continue
            
            if line.startswith('Pokemon = '):
                # Save previous pokemon if exists
                if current_pokemon:
                    pokemon_list.append(current_pokemon)
                
                pokemon_match = re.match(r'Pokemon = ([^,]+),(\d+)', line)
                if pokemon_match:
                    species, level = pokemon_match.groups()
                    current_pokemon = {
                        'Species': species,
                        'Level': int(level)
                    }
                continue
            
            if '=' in line and line == line.lstrip():
                key, value = line.split('=', 1)
                key = key.strip()
                value = value.strip()
                trainer[key] = value
                continue
            
            if line != line.lstrip() and current_pokemon is not None:
                attr_line = line.strip()
                if '=' in attr_line:
                    key, value = attr_line.split('=', 1)
                    key = key.strip()
                    value = value.strip()
                    
                    if '#' in value:
                        value = value.split('#')[0].strip()
                    
                    if key in ['IV', 'Moves']:
                        value = [x.strip() for x in value.split(',')]
                        if key == 'IV':
                            value = [int(x) for x in value]
                    elif key in ['Level', 'AbilityIndex']:
                        value = int(value)
                    elif key in ['Shiny']:
                        value = value.lower() == 'yes'
                    elif key in ['Gender']:
                        value = value.lower()
                    
                    current_pokemon[key] = value
        
        if current_pokemon:
            pokemon_list.append(current_pokemon)
        
        if pokemon_list:
            trainer['Pokemon'] = pokemon_list
        
        return trainer if trainer else None

    def process_trainers_data(self, game_names, base_dir=None):
        """Process trainer data for multiple games."""
        if base_dir is None:
            base_dir = os.path.join(os.path.dirname(__file__), '..', 'games')
        for game_name in game_names:
            print(f"Processing trainers for game: {game_name}")
            
            trainers_txt_file = os.path.join(base_dir, game_name, 'data', 'trainers.txt')
            trainers_json_file = os.path.join(base_dir, game_name, 'data', 'trainers.json')
            
            if not os.path.exists(trainers_txt_file):
                print(f"Trainers file not found for game: {game_name}")
                continue
            
            self.convert_txt_to_json(trainers_txt_file, trainers_json_file)
            print(f"Trainers data converted for game: {game_name}")

if __name__ == '__main__':
    parser = TrainersParser()
    parser.process_trainers_data(['ss2'])