import os
import json
from compare_moves import check_moves

class MovesParser:
    def parse_moves(self, input_file, output_file):
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
                        value = int(value)
                    elif key == 'Flags':
                        value = value.split(',')
                        value = [v.strip() for v in value if v.strip()]
                    move_data[key] = value

            # Extract the move name from the header
            move_name = lines[0][1:-1].strip()  # Remove brackets and strip
            move_data['Name'] = move_name

            moves_list.append(move_data)

        # Write the moves list to a JSON file
        with open(output_file, 'w') as json_file:
            json.dump(moves_list, json_file, indent=4)

    def process_moves_data(self, game_names, base_dir='games'):
        """Process moves data for multiple games."""
        for game_name in game_names:
            print(f"Processing moves for game: {game_name}")
            moves_txt_file = os.path.join(base_dir, game_name, 'data', 'moves.txt')
            moves_json_file = os.path.join(base_dir, game_name, 'data', 'moves.json')

            if not os.path.exists(moves_txt_file):
                print(f"Moves file not found for game: {game_name}")
                continue

            # Parse and save moves
            self.parse_moves(moves_txt_file, moves_json_file)

            # Compare moves and check for mismatches
            mismatches = check_moves(moves_txt_file, moves_json_file)
            if mismatches:
                print(f"Mismatches found for game: {game_name}")
                for mismatch in mismatches:
                    move_name, key, txt_value, json_value = mismatch
                    print(f"- {move_name}: {key} differs (txt: {txt_value}, json: {json_value})")
            else:
                print(f"No mismatches found for game: {game_name}")

if __name__ == '__main__':
    parser = MovesParser()
    parser.process_moves_data(['vanguard', 'ss2'])