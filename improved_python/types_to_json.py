import json

class TypesParser:
    def parse_types(self, input_file, output_file):
        """Parse types from a text file and save to a JSON file."""
        with open(input_file, 'r') as file:
            data = file.read().strip().split('#-------------------------------')

        types_list = []

        for entry in data:
            if not entry.strip():
                continue

            type_data = {}
            lines = entry.strip().split('\n')

            for line in lines:
                if '=' in line:
                    key, value = line.split('=', 1)
                    key = key.strip()
                    value = value.strip()

                    if key in ['TypeID', 'Effectiveness']:
                        value = int(value)
                        type_data[key] = value
                    elif key == 'Weaknesses':
                        value = value.split(',')
                        type_data[key] = value
                        value = [v.strip() for v in value if v.strip()]
                    elif key == 'Resistances':
                        value = value.split(',')
                        type_data[key] = value
                        value = [v.strip() for v in value if v.strip()]
                    elif key == 'Immunities':   
                        value = value.split(',')
                        type_data[key] = value
                        value = [v.strip() for v in value if v.strip()]
                    elif key == 'Name':
                        value = value.upper()
                        type_data[key] = value
                    elif key == 'IconPosition':
                        pass
                    

            types_list.append(type_data)

        # Write the types list to a JSON file
        with open(output_file, 'w') as json_file:
            json.dump(types_list, json_file, indent=4)

    def process_types_data(self, game_names, base_dir='games'):
        """Process types data for multiple games."""
        for game_name in game_names:
            print(f"Processing types for game: {game_name}")
            types_txt_file = f"{base_dir}/{game_name}/data/types.txt"
            types_json_file = f"{base_dir}/{game_name}/data/types.json"

            try:
                self.parse_types(types_txt_file, types_json_file)
                print(f"Successfully processed types for game: {game_name}")
            except FileNotFoundError:
                print(f"Types file not found for game: {game_name}")
            except Exception as e:
                print(f"An error occurred while processing types for game {game_name}: {e}")

if __name__ == '__main__':
    parser = TypesParser()
    parser.process_types_data(['vanguard', 'ss2'])