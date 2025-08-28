import json
import os

class FormsParser:
    def __init__(self):
        pass

    def load_base_pokemon_data(self, base_file):
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
                    
                    if key in ['InternalName', 'Types', 'BaseStats', 'Height', 'Weight', 'Abilities']:
                        if key == 'Types':
                            types = value.split(',')
                            pokemon_data['Type1'] = types[0]
                            if len(types) > 1:
                                pokemon_data['Type2'] = types[1]
                        elif key == 'BaseStats':
                            value = value.split(',')
                        elif key in ['Height', 'Weight']:
                            value = float(value)
                        pokemon_data[key] = value

            internal_name = pokemon_data.get('InternalName')
            if internal_name:
                base_pokemon[internal_name] = pokemon_data
        
        return base_pokemon

    def convert_forms_to_json(self, forms_file, output_file, base_pokemon):
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
                    header = line.strip('[]')
                    base_pokemon_key, *form_info = header.split(',')
                    form_data['BaseName'] = base_pokemon_key.strip()
                    form_number = form_info[0].strip() if form_info else None
                    continue
                
                if '=' in line:
                    key, value = line.split('=', 1)
                    key = key.strip()
                    value = value.strip()
                    
                    if key == 'FormName':
                        form_data['FormName'] = value
                    elif key in ['InternalName', 'Types', 'Type1', 'Type2', 'BaseStats', 'Height', 'Weight', 'Abilities', 'HiddenAbility', 'HiddenAbilities']:
                        if key == 'Types':
                            types = value.split(',')
                            form_data['Type1'] = types[0]
                            if len(types) > 1:
                                form_data['Type2'] = types[1]
                        elif key == 'Type1':
                            form_data['Type1'] = value[0]
                        elif key == 'Type2':
                            form_data['Type2'] = value[1]
                        elif key == 'BaseStats':
                            value = value.split(',')
                        elif key in ['Height', 'Weight']:
                            value = float(value)
                        elif key == 'HiddenAbility' or 'HiddenAbilities':
                            form_data['HiddenAbility'] = value
                        form_data[key] = value
            
            if not form_data['FormName']:
                form_data['FormName'] = f"{form_data['BaseName']} Form {form_number or ''}".strip()
            
            # Merge missing data from base Pokémon
            if base_pokemon_key in base_pokemon:
                base_data = base_pokemon[base_pokemon_key]
                for key, base_value in base_data.items():
                    if key not in form_data:
                        form_data[key] = base_value
            
            forms_list.append(form_data)
        
        with open(output_file, 'w') as json_file:
            json.dump(forms_list, json_file, indent=4)

    def process_forms_data(self, game_names, base_dir='games'):
        """Process forms data for multiple games."""
        for game_name in game_names:
            print(f"Processing forms for game: {game_name}")
            base_file = os.path.join(base_dir, game_name, 'data', 'pokemon.txt')
            forms_file = os.path.join(base_dir, game_name, 'data', 'pokemon_forms.txt')
            output_file = os.path.join(base_dir, game_name, 'data', 'pokemon_forms.json')

            if not os.path.exists(base_file):
                print(f"Base Pokémon file not found for game: {game_name}")
                continue
            if not os.path.exists(forms_file):
                print(f"Forms file not found for game: {game_name}")
                continue

            base_pokemon = self.load_base_pokemon_data(base_file)
            self.convert_forms_to_json(forms_file, output_file, base_pokemon)
            print(f"Forms data converted for game: {game_name}")

if __name__ == '__main__':
    parser = FormsParser()
    parser.process_forms_data(['vanguard', 'ss2'])