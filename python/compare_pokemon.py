import json
import re

def parse_txt_file(file_path):
    """
    Parse the Pokémon definitions from the text file.
    Returns a dictionary with the InternalName as the key.
    """
    pokemon_data = {}
    with open(file_path, 'r') as file:
        content = file.read()
        # Split by Pokémon entries
        entries = re.split(r"(?=\[\d+\])", content)
        for entry in entries:
            if not entry.strip():
                continue
            lines = entry.strip().splitlines()
            entry_dict = {}
            for line in lines:
                if "=" in line:
                    key, value = map(str.strip, line.split("=", 1))
                    entry_dict[key] = value
            if "InternalName" in entry_dict:
                pokemon_data[entry_dict["InternalName"]] = entry_dict
    return pokemon_data

def normalize_field(key, json_value, txt_value):
    """
    Normalize fields to ensure they are comparable.
    Handles:
    - Case insensitivity
    - Lists (comma-separated strings vs. JSON lists)
    - Stripping whitespace
    """
    # Normalize JSON value to string if not already
    if isinstance(json_value, list):
        json_value = ",".join(map(str, json_value))  # Convert JSON list to comma-separated string
    
    # Normalize TXT value to string if not already
    if isinstance(txt_value, list):
        txt_value = ",".join(map(str, txt_value))

    # Case-insensitive comparison for fields like 'Name'
    if key in ["Name"]:
        return str(json_value).strip().lower() == str(txt_value).strip().lower()

    # Normalize lists for fields like 'BaseStats' and 'EffortPoints'
    if key in ["BaseStats", "EffortPoints"]:
        json_list = list(map(str.strip, str(json_value).split(",")))
        txt_list = list(map(str.strip, str(txt_value).split(",")))
        return json_list == txt_list

    # Default: Strict string comparison
    return str(json_value).strip() == str(txt_value).strip()

# Define optional fields
OPTIONAL_FIELDS = ["Forms"]

def validate_and_compare(json_file, txt_file):
    """
    Validate JSON data against predefined rules and compare it with the txt file data.
    """
    # Load JSON data
    with open(json_file, 'r') as f:
        json_data = json.load(f)
    
    # Parse txt file
    txt_data = parse_txt_file(txt_file)

    # Validation results
    errors = []

    for pokemon in json_data:
        internal_name = pokemon.get("InternalName")
        
        # Check if the InternalName exists in the txt file
        if internal_name not in txt_data:
            errors.append(f"'{internal_name}' is present in JSON but not found in the text file.")
            continue

        txt_entry = txt_data[internal_name]

        # Compare fields between JSON and txt entry
        for key, value in pokemon.items():
            if key in OPTIONAL_FIELDS and key not in txt_entry:
                # Skip optional fields that are missing
                continue
            if key in txt_entry:
                txt_value = txt_entry[key]
                if not normalize_field(key, value, txt_value):
                    errors.append(
                        f"Mismatch in '{key}' for {internal_name}: "
                        f"JSON has '{value}', but TXT has '{txt_value}'."
                    )
            else:
                errors.append(
                    f"'{key}' is present in JSON for {internal_name} but missing in the text file."
                )

        # Check for fields in the txt entry missing from JSON
        for key in txt_entry.keys():
            if key not in pokemon and key not in OPTIONAL_FIELDS:
                errors.append(
                    f"'{key}' is present in the text file for {internal_name} but missing in JSON."
                )

    return errors

def validate_forms(pokemon_data, forms_file):
    # Read and parse the forms data from pokemon_forms.txt
    with open(forms_file, 'r') as f:
        form_definitions = {}
        for line in f:
            # Assuming the format is 'FormName:Field1,Field2,...'
            form_name, fields = line.strip().split(':')
            form_definitions[form_name] = set(fields.split(','))

    # Validate forms in the Pokémon JSON
    for pokemon in pokemon_data:
        if "Forms" in pokemon:
            for form in pokemon["Forms"]:
                form_name = form.get("FormName")
                if form_name and form_name in form_definitions:
                    # Get the required fields for this form
                    required_fields = form_definitions[form_name]
                    # Check missing fields
                    missing_fields = required_fields - form.keys()
                    if missing_fields:
                        print(f"Form '{form_name}' of Pokémon '{pokemon['Name']}' is missing fields: {missing_fields}")
                else:
                    print(f"Form '{form_name}' for Pokémon '{pokemon['Name']}' not defined in {forms_file}")

# Main execution
if __name__ == "__main__":
    json_file_path = "data/merged_pokemon.json"
    txt_file_path = "data/pokemon.txt"
    forms_txt_file_path = 'data/pokemon_forms.txt'

    errors = validate_and_compare(json_file_path, txt_file_path)
    
    forms_errors = validate_forms(json_file_path, forms_txt_file_path)
    
    if errors:
        print("Validation and comparison errors:")
        for error in errors:
            print(f"- {error}")
        for error in forms_errors:
            print(f"- {error}")
    else:
        print("All JSON data is valid and matches the text file definitions!")
