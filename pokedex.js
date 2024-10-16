document.addEventListener("DOMContentLoaded", () => {
    // Fetch the Pokémon data from the JSON file
    fetch('path/to/your/pokemon-data.json')
        .then(response => response.json())
        .then(pokemonData => {
            // Populate the dropdown with Pokémon names
            const dropdown = document.getElementById('pokemonSelect');
            for (let pokemonName in pokemonData) {
                const option = document.createElement('option');
                option.value = pokemonName;
                option.textContent = pokemonData[pokemonName].Name;
                dropdown.appendChild(option);
            }

            // Function to update the displayed Pokémon content
            function updatePokedexContent(selectedPokemon) {
                const pokemon = pokemonData[selectedPokemon];

                let content = `
                    <h1>${pokemon.Name}</h1>
                    <img src="images/${pokemon.InternalName}.png" alt="${pokemon.Name}">
                    <div class="type">Type: ${pokemon.Type1} / ${pokemon.Type2}</div>
                    
                    <div class="stats">
                        <h3>Stats</h3>
                        <div>HP: ${pokemon.HP}</div>
                        <div>Attack: ${pokemon.Attack}</div>
                        <div>Defense: ${pokemon.Defense}</div>
                        <div>Sp. Attack: ${pokemon.SpAtk}</div>
                        <div>Sp. Defense: ${pokemon.SpDef}</div>
                        <div>Speed: ${pokemon.Spd}</div>
                    </div>
                    
                    <div class="abilities">
                        <h3>Abilities</h3>
                        <div>${pokemon.Abilities.split(', ').join('<br>')}</div>
                        <div><strong>Hidden Ability:</strong> ${pokemon.HiddenAbility}</div>
                    </div>
                    
                    <div class="evolution">
                        <h3>Evolution Line</h3>
                        <div>${pokemon.EvolutionLine}</div>
                    </div>
                `;

                // Insert the generated content into the pokedex element
                document.getElementById('pokedex').innerHTML = content;
            }

            // Add event listener to dropdown
            dropdown.addEventListener('change', function(e) {
                const selectedPokemon = e.target.value;
                // Update the Pokedex content with the selected Pokémon
                updatePokedexContent(selectedPokemon);
            });

            // Initialize by showing the first Pokémon in the list
            const firstPokemon = dropdown.options[0].value;
            updatePokedexContent(firstPokemon);
        })
        .catch(error => console.error('Error fetching the Pokémon data:', error));
});
