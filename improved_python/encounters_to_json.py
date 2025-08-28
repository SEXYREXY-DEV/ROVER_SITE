import os
import json
import re

class EncountersParser:
    def parse_encounters(self, input_file, output_file):
        """Parse encounters from a text file and write to JSON."""
        with open(input_file, 'r') as file:
            data = file.read().strip().split('#-------------------------------')

        all_maps = []

        for entry in data:
            if not entry.strip():
                continue

            lines = entry.strip().splitlines()
            map_id, map_name = self._parse_map_header(lines[0])

            encounters = {}
            current_type = None

            for line in lines[1:]:
                line = line.strip()
                if not line:
                    continue

                # If line starts a new encounter type (e.g. "Water,4" or "OldRod")
                if re.match(r'^[A-Za-z]+(Day|Night|Morning)?(,\d+)?$', line):
                    parts = line.split(',')
                    current_type = parts[0]
                    rate = int(parts[1]) if len(parts) > 1 else None
                    encounters[current_type] = {
                        'Rate': rate,
                        'Pokemon': []
                    }
                else:
                    # Pokemon encounter line (e.g. "20,FINNEON,5")
                    if current_type is None:
                        continue  # Ignore stray data
                    chance, species, level = [x.strip() for x in line.split(',')]
                    encounters[current_type]['Pokemon'].append({
                        'Chance': int(chance),
                        'Species': species,
                        'Level': int(level)
                    })

            all_maps.append({
                'MapID': map_id,
                'MapName': map_name,
                'Encounters': encounters
            })

        with open(output_file, 'w') as json_file:
            json.dump(all_maps, json_file, indent=4)

    def _parse_map_header(self, header_line):
        """Extract map ID and name from header line."""
        match = re.match(r'\[(\d+)]\s*#\s*(.+)', header_line)
        if match:
            return match.group(1), match.group(2).strip()
        return "UNKNOWN", "Unnamed Map"

    def process_encounters_data(self, game_names, base_dir='games'):
        for game_name in game_names:
            print(f"Processing encounters for game: {game_name}")
            encounters_txt_file = os.path.join(base_dir, game_name, 'data', 'encounters.txt')
            encounters_json_file = os.path.join(base_dir, game_name, 'data', 'encounters.json')

            if not os.path.exists(encounters_txt_file):
                print(f"Encounters file not found for game: {game_name}")
                continue

            self.parse_encounters(encounters_txt_file, encounters_json_file)
            print(f"Finished processing: {game_name}")

if __name__ == '__main__':
    parser = EncountersParser()
    parser.process_encounters_data(['vanguard', 'ss2'])
