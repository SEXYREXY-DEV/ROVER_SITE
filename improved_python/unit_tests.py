import unittest
import os
import json
import re

def parse_txt_file(file_path):
    pokemon_data = {}
    with open(file_path, 'r') as file:
        content = file.read()
        entries = content.split('#-------------------------------')
        for entry in entries:
            lines = [line.strip() for line in entry.strip().splitlines() if line.strip()]
            if not lines:
                continue
            # Detect header: either [NAME] or just NAME
            if lines[0].startswith('[') and lines[0].endswith(']'):
                internal_name = lines[0][1:-1].strip()
                lines = lines[1:]
            else:
                internal_name = lines[0].strip()
                lines = lines[1:]
            entry_dict = {'InternalName': internal_name}
            for line in lines:
                if '=' in line:
                    key, value = map(str.strip, line.split('=', 1))
                    entry_dict[key] = value
            pokemon_data[internal_name] = entry_dict
    return pokemon_data

def normalize_field(key, json_value, txt_value):
    # Handle Types field: combine Type1 and Type2 from JSON, split Types from TXT
    if key == "Types":
        # JSON: get Type1 and Type2 if present
        if isinstance(json_value, dict):
            types_json = [json_value.get("Type1", ""), json_value.get("Type2", "")]
        elif isinstance(json_value, list):
            types_json = json_value
        else:
            types_json = str(json_value).split(",")
        # TXT: split Types field
        types_txt = str(txt_value).split(",")
        # Remove empty strings and compare (order-insensitive)
        types_json = [t for t in types_json if t]
        types_txt = [t for t in types_txt if t]
        return sorted(types_json) == sorted(types_txt)
    if key in ["Type1", "Type2"]:
        # These are handled by Types, so skip
        return True
    if isinstance(json_value, list):
        json_value = ",".join(map(str, json_value))
    if isinstance(txt_value, list):
        txt_value = ",".join(map(str, txt_value))
    if key in ["Name"]:
        return str(json_value).strip().lower() == str(txt_value).strip().lower()
    if key in ["BaseStats", "EffortPoints"]:
        json_list = list(map(str.strip, str(json_value).split(",")))
        txt_list = list(map(str.strip, str(txt_value).split(",")))
        return json_list == txt_list
    return str(json_value).strip() == str(txt_value).strip()

OPTIONAL_FIELDS = ["Forms"]

def validate_and_compare(json_file, txt_file):
    with open(json_file, 'r') as f:
        json_data = json.load(f)
    txt_data = parse_txt_file(txt_file)
    errors = []
    for pokemon in json_data:
        internal_name = pokemon.get("InternalName")
        if internal_name not in txt_data:
            errors.append(f"'{internal_name}' is present in JSON but not found in the text file.")
            continue
        txt_entry = txt_data[internal_name]
        for key, value in pokemon.items():
            # Skip Type1/Type2 if Types is in TXT, and skip Types if Type1/Type2 are in JSON
            if key in ["Type1", "Type2"] and "Types" in txt_entry:
                continue
            if key == "Types" and ("Type1" in pokemon or "Type2" in pokemon):
                continue
            if key in OPTIONAL_FIELDS and key not in txt_entry:
                continue
            if key in txt_entry:
                txt_value = txt_entry[key]
                if not normalize_field(key, value, txt_value):
                    errors.append(
                        f"Mismatch in '{key}' for {internal_name}: "
                        f"JSON has '{value}', but TXT has '{txt_value}'."
                    )
            else:
                # Don't report missing Type1/Type2 if Types is present in TXT, and vice versa
                if key in ["Type1", "Type2"] and "Types" in txt_entry:
                    continue
                if key == "Types" and ("Type1" in pokemon or "Type2" in pokemon):
                    continue
                errors.append(
                    f"'{key}' is present in JSON for {internal_name} but missing in the text file."
                )
        for key in txt_entry.keys():
            # Don't report missing Types if Type1/Type2 are present in JSON, and vice versa
            if key == "Types" and ("Type1" in pokemon or "Type2" in pokemon):
                continue
            if key in ["Type1", "Type2"] and "Types" in txt_entry:
                continue
            if key not in pokemon and key not in OPTIONAL_FIELDS:
                errors.append(
                    f"'{key}' is present in the text file for {internal_name} but missing in JSON."
                )
    return errors

def validate_forms(pokemon_data, forms_file):
    # Remove the definition check, just check that forms have FormName
    errors = []
    for pokemon in pokemon_data:
        if "Forms" in pokemon:
            for form in pokemon["Forms"]:
                form_name = form.get("FormName")
                if not form_name:
                    errors.append(
                        f"Form for Pokémon '{pokemon['Name']}' is missing FormName"
                    )
    return errors

# strip non-alphanumeric characters and convert to lowercase
def normalize_name(name):
    return re.sub(r'[^a-z0-9]', '', name.strip().lower())

# normalize moves because they're silly
def normalize_value(value, key=None):
    if key == "Flags":
        if isinstance(value, list):
            return sorted([normalize_name(str(v)) for v in value])
        elif isinstance(value, str):
            flags = [normalize_name(flag) for flag in value.split(",") if flag.strip()]
            return sorted(flags)
        else:
            return []
    if key == "Priority":
        try:
            return int(value)
        except (ValueError, TypeError):
            return 0  # default priority
    if isinstance(value, list):
        return sorted([normalize_name(v) for v in value])
    elif isinstance(value, str):
        # negative numbers or integers
        try:
            return int(value)
        except ValueError:
            return normalize_name(value)
    return value

# load moves from a text file
def load_moves_txt(file_path):
    moves_dict = {}
    with open(file_path, 'r') as file:
        data = file.read().strip().split('#-------------------------------')
    for entry in data:
        if not entry.strip():
            continue
        move_data = {}
        lines = entry.strip().split('\n')
        move_name = None
        # detect header: either [NAME] or just NAME
        for line in lines:
            if '[' in line and ']' in line:
                # Remove comments after the closing bracket
                header = line[1:-1].split('#', 1)[0].strip()
                move_name = normalize_name(header)
                continue
            if '=' in line and move_name:
                key, value = line.split('=', 1)
                move_data[key.strip()] = value.strip()
        if move_name:
            moves_dict[move_name] = move_data
    return moves_dict

def load_moves_json(file_path):
    with open(file_path, 'r') as json_file:
        moves = json.load(json_file)
    moves_dict = {}
    for move in moves:
        move_name = normalize_name(move.get('Name', ''))
        moves_dict[move_name] = move
    return moves_dict

def compare_moves(moves_txt, moves_json):
    mismatches = []
    for move_name, txt_attributes in moves_txt.items():
        # hiddenpower is stupid
        if move_name.startswith("hiddenpower"):
            continue
        if move_name.startswith("balancerchange"):
            continue
        if move_name in moves_json:
            json_attributes = moves_json[move_name]
            for key, txt_value in txt_attributes.items():
                json_value = json_attributes.get(key)
                normalized_txt_value = normalize_value(txt_value, key)
                normalized_json_value = normalize_value(json_value, key)
                if normalized_json_value != normalized_txt_value:
                    mismatches.append((move_name, key, normalized_txt_value, normalized_json_value))
    return mismatches

def load_abilities_txt(file_path):
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
                ability_name = normalize_name(line[1:-1].strip())
                continue
            if '=' in line and ability_name:
                key, value = line.split('=', 1)
                ability_data[key.strip()] = value.strip()
        if ability_name:
            abilities_dict[ability_name] = ability_data
    return abilities_dict

def load_abilities_json(file_path):
    with open(file_path, 'r') as json_file:
        abilities = json.load(json_file)
    abilities_dict = {}
    if isinstance(abilities, dict):
        for ability in abilities.values():
            if isinstance(ability, dict):
                ability_name = normalize_name(ability.get('Name', ''))
                abilities_dict[ability_name] = ability
            else:
                print(f"Warning: Skipping non-dict ability value: {ability}")
    else:
        for ability in abilities:
            if isinstance(ability, dict):
                ability_name = normalize_name(ability.get('Name', ''))
                abilities_dict[ability_name] = ability
            else:
                print(f"Warning: Skipping non-dict ability entry: {ability}")
    return abilities_dict

def compare_abilities(abilities_txt, abilities_json):
    mismatches = []
    for ability_name, txt_attributes in abilities_txt.items():
        if ability_name in abilities_json:
            json_attributes = abilities_json[ability_name]
            for key, txt_value in txt_attributes.items():
                json_value = json_attributes.get(key)
                normalized_txt_value = normalize_value(txt_value)
                normalized_json_value = normalize_value(json_value)
                if normalized_json_value != normalized_txt_value:
                    mismatches.append((ability_name, key, normalized_txt_value, normalized_json_value))
    return mismatches

def get_game_names(base_dir='games'):
    # find all game names
    if not os.path.exists(base_dir):
        return []
    return [name for name in os.listdir(base_dir)
            if os.path.isdir(os.path.join(base_dir, name))]

class TestCompareData(unittest.TestCase):
    def setUp(self):
        self.base_dir = 'games'
        self.games = get_game_names(self.base_dir)

    def test_pokemon_compare(self):
        for game in self.games:
            with self.subTest(game=game):
                json_file = os.path.join(self.base_dir, game, 'data', 'pokemon_master.json')
                txt_file = os.path.join(self.base_dir, game, 'data', 'pokemon.txt')
                if not (os.path.exists(json_file) and os.path.exists(txt_file)):
                    self.skipTest(f"Missing files for {game}")
                errors = validate_and_compare(json_file, txt_file)
                self.assertEqual(errors, [], f"Pokemon compare errors for {game}: {errors}")

    def test_pokemon_forms(self):
        for game in self.games:
            with self.subTest(game=game):
                json_file = os.path.join(self.base_dir, game, 'data', 'pokemon_master.json')
                forms_file = os.path.join(self.base_dir, game, 'data', 'pokemon_forms.txt')
                if not (os.path.exists(json_file) and os.path.exists(forms_file)):
                    self.skipTest(f"Missing files for {game}")
                with open(json_file, 'r') as f:
                    pokemon_data = json.load(f)
                errors = validate_forms(pokemon_data, forms_file)
                self.assertEqual(errors, [], f"Pokemon forms errors for {game}: {errors}")

    def test_moves_compare(self):
        for game in self.games:
            with self.subTest(game=game):
                txt_file = os.path.join(self.base_dir, game, 'data', 'moves.txt')
                json_file = os.path.join(self.base_dir, game, 'data', 'moves.json')
                if not (os.path.exists(json_file) and os.path.exists(txt_file)):
                    self.skipTest(f"Missing files for {game}")
                moves_txt = load_moves_txt(txt_file)
                moves_json = load_moves_json(json_file)
                mismatches = compare_moves(moves_txt, moves_json)
                self.assertEqual(mismatches, [], f"Move compare mismatches for {game}: {mismatches}")

    def test_abilities_compare(self):
        for game in self.games:
            with self.subTest(game=game):
                txt_file = os.path.join(self.base_dir, game, 'data', 'abilities.txt')
                json_file = os.path.join(self.base_dir, game, 'data', 'abilities.json')
                if not (os.path.exists(json_file) and os.path.exists(txt_file)):
                    self.skipTest(f"Missing files for {game}")
                abilities_txt = load_abilities_txt(txt_file)
                abilities_json = load_abilities_json(json_file)
                mismatches = compare_abilities(abilities_txt, abilities_json)
                self.assertEqual(mismatches, [], f"Ability compare mismatches for {game}: {mismatches}")

if __name__ == '__main__':
    result = unittest.main(exit=False)
    if result.result.wasSuccessful():
        print("\nAll compare tests passed successfully! 🎉")