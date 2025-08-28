import os
import json
import re
from compare_abilities import check_abilities

class AbilitiesParser:
    def normalize_name(self, name):
        """Normalize the name by stripping spaces and converting to lowercase."""
        return re.sub(r'[^a-z0-9]', '', name.strip().lower())

    def parse_abilities(self, input_file, output_file):
        """Parse abilities from a text file and save to a JSON file."""
        with open(input_file, 'r') as file:
            data = file.read().strip().split('#-------------------------------')

        abilities_list = []

        for entry in data:
            if not entry.strip():
                continue

            ability_data = {}
            lines = entry.strip().split('\n')
            ability_name = None

            for line in lines:
                if line.startswith('[') and line.endswith(']'):
                    ability_name = line[1:-1].strip()
                    ability_data['Name'] = ability_name  # Keep raw name
                    continue

                if '=' in line:
                    key, value = line.split('=', 1)
                    ability_data[key.strip()] = value.strip()

            if ability_name:
                abilities_list.append(ability_data)

        # Write the abilities list to a JSON file
        with open(output_file, 'w') as json_file:
            json.dump(abilities_list, json_file, indent=4)

    def process_abilities_data(self, game_names, base_dir='games'):
        """Process abilities data for multiple games."""
        for game_name in game_names:
            print(f"Processing abilities for game: {game_name}")
            abilities_txt_file = os.path.join(base_dir, game_name, 'data', 'abilities.txt')
            abilities_json_file = os.path.join(base_dir, game_name, 'data', 'abilities.json')

            if not os.path.exists(abilities_txt_file):
                print(f"Abilities file not found for game: {game_name}")
                continue

            # Parse and save abilities
            self.parse_abilities(abilities_txt_file, abilities_json_file)

            # Compare abilities and check for mismatches
            mismatches = check_abilities(abilities_txt_file, abilities_json_file)
            if mismatches:
                print(f"Mismatches found for game: {game_name}")
                for mismatch in mismatches:
                    ability_name, key, txt_value, json_value = mismatch
                    print(f"- {ability_name}: {key} differs (txt: {txt_value}, json: {json_value})")
            else:
                print(f"No mismatches found for game: {game_name}")

if __name__ == '__main__':
    parser = AbilitiesParser()
    parser.process_abilities_data(['vanguard', 'ss2'])
