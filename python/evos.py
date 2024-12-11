import json

class Evolution:
    def __init__(self, json_path, new_json_path):
        self.json_path = json_path
        self.new_json_path = new_json_path
        # Load JSON data from the original file
        with open(self.json_path, 'r') as file:
            self.pokedex_data = json.load(file)
        self.evos_dict = {}
        self.method_dict = {}

    def find_evolution(self, base_pokemon):
        base_pokemon = base_pokemon.upper()
        # Search for the Pokémon in the Pokedex data
        pokemon_row = next((pokemon for pokemon in self.pokedex_data if pokemon['InternalName'] == base_pokemon), None)
        if pokemon_row and 'Evolutions' in pokemon_row and pokemon_row['Evolutions']:
            evolution = pokemon_row['Evolutions']
            evolutions = evolution.split(',')
            evolution_names = [e.strip() for e in evolutions]
            #print(evolution_names)
            evolution_name = evolution_names[0]
            
            evolution_method = evolution_names[2] if len(evolution_names) > 2 else None
            #print(evolution_method)#, evolution_method)
            if evolution_method:
                self.method_dict[evolution_name] = evolution_method
                #print(evolution_method)
            if len(evolutions) > 1:
                # Extract subsequent evolution names and methods every 3rd word after the first one
                for i in range(3, len(evolutions), 3):
                    #print(evolution_names)
                    if i < len(evolutions):
                        evolution_name += f", {evolution_names[i]}"
                        #print(evolution_name)
                        if i + 2 < len(evolution_names):
                            evolution_method = evolution_names[i + 2]
                            self.method_dict[evolution_names[i]] = evolution_method
                            #print(evolution_method)
            return evolution_name      
        else:
            return None

    def find_more_evolutions(self, pokemon):
        evo_list = []
        evo_list.append(pokemon)
        pokemon2 = self.find_evolution(pokemon)
        if pokemon2 is not None:
            evo_list.append(pokemon2)
            pokemon3 = self.find_evolution(pokemon2)
            if pokemon3 is not None:
                evo_list.append(pokemon3)
        if len(evo_list) > 1:
            return evo_list

    def generate_evolution_dict(self):
        for pokemon in self.pokedex_data:
            evolution_list = self.find_more_evolutions(pokemon['InternalName'])
            self.evos_dict.update({pokemon['InternalName']: evolution_list})
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
                # For each Pokémon in the evolution line, format with methods if available
                for i, evo_pokemon in enumerate(evolution_line):
                    # Check if the evolution method is available for this Pokémon
                    if evo_pokemon in self.method_dict:
                        method = self.method_dict[evo_pokemon]
                        if method:  # If a method exists, append it to the evolution name
                            evolution_line_str += f"{evo_pokemon}({method})"
                    else:
                        evolution_line_str += evo_pokemon
                    # Add a comma if it's not the last evolution
                    if i < len(evolution_line) - 1:
                        evolution_line_str += ', '

                pokemon['EvolutionLine'] = evolution_line_str
            updated_pokedex_data.append(pokemon)

        # Write the updated data to a new JSON file
        with open(self.new_json_path, 'w') as file:
            json.dump(updated_pokedex_data, file, indent=4)

# Example usage:
json_path = 'data/merged_pokemon.json'  # Path to the original JSON file
new_json_path = 'data/pokemon_data_with_evolutions.json'  # Path to the new JSON file with EvolutionLine
pokedex = Evolution(json_path, new_json_path)
evos_dict = pokedex.generate_evolution_dict()
pokedex.update_json(evos_dict)
