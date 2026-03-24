import json
import os

class PokemonCombiner:
    def __init__(self, base_dir='games'):
        self.base_dir = base_dir

    def merge_pokemon_data(self, game_name):
        # Define file paths based on the game name and base_dir
        base_file_path = os.path.join(self.base_dir, game_name, 'data', 'pokemon.json')
        form_file_path = os.path.join(self.base_dir, game_name, 'data', 'pokemon_forms.json')
        merged_file_path = os.path.join(self.base_dir, game_name, 'data', 'pokemon_master.json')

        try:
            # Load base Pokémon data from base JSON file
            with open(base_file_path, 'r') as base_file:
                base_data = json.load(base_file)

            # Load form data from form JSON file
            with open(form_file_path, 'r') as form_file:
                form_data = json.load(form_file)

            merged_pokemon = {}

            #
            print(f"Base data structure for {game_name}:")
            for base_pokemon in base_data:
                print(base_pokemon)
                break

            # Iterate through base Pokémon data and add to merged_pokemon dictionary
            for base_pokemon in base_data:
                try:
                    base_name = base_pokemon["InternalName"]
                    merged_pokemon[base_name] = base_pokemon
                except KeyError:
                    print(f"Warning: 'InternalName' not found in this base entry: {base_pokemon}")
            form_counters = {}

            for form in form_data:
                base_name = form["BaseName"]

                if base_name in merged_pokemon:
                    if "BaseStats" not in form:
                        print(f"Warning: 'BaseStats' not found in form for {base_name} - skipping form.")
                        continue

                    form_data_copy = form.copy()

                    # Determine internal name based on form type
                    form_name_lower = form.get("FormName", "").lower()

                    #if "anomaly" in form_name_lower:
                    #    internal_name = f"{base_name}_2"
                    if "mega" in form_name_lower:
                        internal_name = f"{base_name}_1"
                    else:
                        # Start generic form counter at 1 if not already
                        if base_name not in form_counters:
                            form_counters[base_name] = 1

                        # Skip _1 if mega already used it
                        while f"{base_name}_{form_counters[base_name]}" in [
                            f.get("InternalName", "") for f in merged_pokemon[base_name].get("Forms", [])
                        ]:
                            form_counters[base_name] += 1

                        internal_name = f"{base_name}_{form_counters[base_name]}"
                        form_counters[base_name] += 1

                    form_data_copy["InternalName"] = internal_name

                    # Add the form to the base Pokémon
                    merged_pokemon[base_name].setdefault("Forms", [])
                    merged_pokemon[base_name]["Forms"].append(form_data_copy)
                else:
                    print(f"Warning: Base name {base_name} not found in base data.")


            # Write the merged Pokémon data to a new JSON file
            with open(merged_file_path, 'w') as merged_file:
                json.dump(list(merged_pokemon.values()), merged_file, indent=4)

            print(f"Merge completed and saved to {merged_file_path}")

        except FileNotFoundError as e:
            print(f"Error: File not found - {e}")
        except json.JSONDecodeError as e:
            print(f"Error: Failed to decode JSON - {e}")

    def process_multiple_games(self, game_names):
        for game_name in game_names:
            self.merge_pokemon_data(game_name)

if __name__ == '__main__':
    combiner = PokemonCombiner(base_dir='games')
    combiner.process_multiple_games(['vanguard', 'ss2'])