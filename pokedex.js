document.addEventListener("DOMContentLoaded", () => {
    // Fetch the Pokémon data from the JSON file
    fetch('pokedex.json')
        .then(response => response.json())
        .then(data => {
            console.log(data); // Log the data to check if it loads successfully
            const pokemonContainer = document.getElementById('pokemon-container');
            const pokemonSelect = document.getElementById('pokemon-select');

            // Base path for images
            const baseImagePath = 'Front/'; // Change this based on your folder structure

            // Populate the dropdown with Pokémon names
            data.forEach(pokemon => {
                const option = document.createElement('option');
                option.value = pokemon.InternalName; // Set value to InternalName
                option.textContent = pokemon.Name; // Display Name in dropdown
                pokemonSelect.appendChild(option);
            });

            // Function to update Pokémon details based on selection
            function updatePokemonDetails(internalName) {
                const selectedPokemon = data.find(pokemon => pokemon.InternalName === internalName);

                if (selectedPokemon) {
                    // Clear previous content
                    pokemonContainer.innerHTML = '';

                    // Create new entry with selected Pokémon details
                    const entry = document.createElement('div');
                    entry.classList.add('pokemon-entry');
                    entry.innerHTML = `
                        <h2>${selectedPokemon.Name}</h2>
                        <img src="${baseImagePath}${selectedPokemon.InternalName}.png" alt="${selectedPokemon.Name} image" class="pokemon-image">
                        <p><strong>Type:</strong> ${selectedPokemon.Type1} ${selectedPokemon.Type2 ? ' / ' + selectedPokemon.Type2 : ''}</p>
                        <p><strong>HP:</strong> ${selectedPokemon.HP}</p>
                        <p><strong>Attack:</strong> ${selectedPokemon.Attack}</p>
                        <p><strong>Defense:</strong> ${selectedPokemon.Defense}</p>
                        <p><strong>Special Attack:</strong> ${selectedPokemon.SpAtk}</p>
                        <p><strong>Special Defense:</strong> ${selectedPokemon.SpDef}</p>
                        <p><strong>Speed:</strong> ${selectedPokemon.Spd}</p>
                        <p><strong>Abilities:</strong> ${selectedPokemon.Abilities}</p>
                        <p><strong>Hidden Ability:</strong> ${selectedPokemon.HiddenAbility}</p>
                        <p><strong>Evolutions:</strong> ${selectedPokemon.Evolutions}</p>
                        <p><strong>Location Found:</strong> ${selectedPokemon["Location Found"] || 'Not found'}</p>
                        <p><strong>Evolution Line:</strong> ${selectedPokemon["Evolution Line"]}</p>
                    `;
                    pokemonContainer.appendChild(entry);
                }
            }

            // Event listener to detect dropdown change and update details
            pokemonSelect.addEventListener('change', (e) => {
                const selectedValue = e.target.value;
                updatePokemonDetails(selectedValue);
            });

            // Display the first Pokémon by default
            if (data.length > 0) {
                updatePokemonDetails(data[0].InternalName); // Load first Pokémon details by default
            }
        })
        .catch(error => console.error('Error loading Pokémon data:', error));
});
