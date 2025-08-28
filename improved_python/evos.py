import json
import os

class Evolution:
    def __init__(self, json_path, new_json_path):
        self.json_path = json_path
        self.new_json_path = new_json_path
        with open(self.json_path, 'r') as file:
            self.pokedex_data = json.load(file)
        self.evos_dict = {}
        self.method_dict = {}

    def find_evolutions(self, base_pokemon):
        """Return a list of all possible evolutions for a given Pokémon."""
        base_pokemon = base_pokemon.upper()
        pokemon_row = next((pokemon for pokemon in self.pokedex_data if pokemon['InternalName'] == base_pokemon), None)
        if pokemon_row and 'Evolutions' in pokemon_row and pokemon_row['Evolutions']:
            evolutions = pokemon_row['Evolutions'].split(',')
            evo_list = []
            for i in range(0, len(evolutions), 3):
                if i + 2 < len(evolutions):
                    evo_name = evolutions[i].strip()
                    evo_method = evolutions[i + 2].strip()
                    self.method_dict[evo_name] = evo_method
                    evo_list.append(evo_name)
            return evo_list
        return []

    def get_evolution_line(self, pokemon, visited=None):
        """Recursively get all Pokémon in the evolution line, including branches."""
        if visited is None:
            visited = set()
        pokemon = pokemon.upper()
        if pokemon in visited:
            return []
        visited.add(pokemon)
        evolutions = self.find_evolutions(pokemon)
        if not evolutions:
            return [pokemon]
        lines = []
        for evo in evolutions:
            sub_line = self.get_evolution_line(evo, visited.copy())
            lines.append([pokemon] + sub_line)
        # Flatten and deduplicate
        flat = []
        for line in lines:
            for p in line:
                if p not in flat:
                    flat.append(p)
        return flat

    def generate_evolution_dict(self):
        for pokemon in self.pokedex_data:
            evolution_list = self.get_evolution_line(pokemon['InternalName'])
            self.evos_dict[pokemon['InternalName']] = evolution_list
        self.update_evolution_lines(self.evos_dict)
        return self.evos_dict

    def update_evolution_lines(self, dictionary):
        for key, value in list(dictionary.items()):
            if value is None:
                dictionary[key] = []
            result_key = self.search(dictionary, key)
            if result_key:
                dictionary[key] = dictionary[result_key]
            else:
                if key not in dictionary[key]:
                    dictionary[key].append(key)

    def search(self, values, searchFor):
        for k, v_list in values.items():
            if v_list is not None and searchFor in v_list:
                return k
        return None

    def update_json(self, evolution_dict):
        updated_pokedex_data = []
        for pokemon in self.pokedex_data:
            internal_name = pokemon['InternalName']
            evolution_line = evolution_dict.get(internal_name)
            if evolution_line and len(evolution_line) > 1:
                evolution_line_str = ''
                for i, evo_pokemon in enumerate(evolution_line):
                    if evo_pokemon in self.method_dict:
                        method = self.method_dict[evo_pokemon]
                        if method:
                            evolution_line_str += f"{evo_pokemon}({method})"
                        else:
                            evolution_line_str += evo_pokemon
                    else:
                        evolution_line_str += evo_pokemon
                    if i < len(evolution_line) - 1:
                        evolution_line_str += ', '
                pokemon['EvolutionLine'] = evolution_line_str
            updated_pokedex_data.append(pokemon)
        with open(self.new_json_path, 'w') as file:
            json.dump(updated_pokedex_data, file, indent=4)

    @classmethod
    def process_multiple_games(cls, game_names, base_dir='games'):
        for game_name in game_names:
            json_path = os.path.join(base_dir, game_name, 'data', 'pokemon_master.json')
            new_json_path = os.path.join(base_dir, game_name, 'data', 'pokemon_master_evo.json')
            if not os.path.exists(json_path):
                print(f"Base merged Pokémon file not found for game: {game_name}")
                continue
            pokedex = cls(json_path, new_json_path)
            evos_dict = pokedex.generate_evolution_dict()
            pokedex.update_json(evos_dict)
            print(f"Evolution data processed for game: {game_name}")

if __name__ == '__main__':
    Evolution.process_multiple_games(['vanguard', 'ss2'])