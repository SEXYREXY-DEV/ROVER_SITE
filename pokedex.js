document.addEventListener("DOMContentLoaded", () => {
    // Fetch Pokémon data from JSON file
    fetch('path/to/your/pokemon-data.json')
        .then(response => response.json())
        .then(pokemonData => {
            const dropdown = document.getElementById('pokemonSelect');
            const pokemonInfo = document.getElementById('pokemonInfo');

            // Populate the dropdown with Pokémon names
            for (let pokemonName in pokemonData) {
                const option = document.createElement('option');
                option.value = pokemonName;
                option.textContent = pokemonData[pokemonName].Name;
                dropdown.appendChild(option);
            }

            // Function to update the display with selected Pokémon details
            function updatePokedexContent(selectedPokemon) {
                const pokemon = pokemonData[selectedPokemon];

                // Clear existing content
                pokemonInfo.innerHTML = '';

                // Generate the content based on Pokémon data
                pokemonInfo.innerHTML = `
                    <h1>${pokemon.Name}</h1>
                    <img src="images/${pokemon.InternalName}.png" alt="${pokemon.Name}">
                    
                    <div class="pokemon-types">
                        <strong>Type:</strong> ${pokemon.Type1} / ${pokemon.Type2 || 'None'}
                    </div>

                    <div class="pokemon-stats">
                        <h3>Stats</h3>
                        <div>HP: ${pokemon.HP}</div>
                        <div>Attack: ${pokemon.Attack}</div>
                        <div>Defense: ${pokemon.Defense}</div>
                        <div>Sp. Attack: ${pokemon.SpAtk}</div>
                        <div>Sp. Defense: ${pokemon.SpDef}</div>
                        <div>Speed: ${pokemon.Spd}</div>
                    </div>

                    <div class="pokemon-abilities">
                        <h3>Abilities</h3>
                        <div>${pokemon.Abilities.split(', ').join('<br>')}</div>
                        <div><strong>Hidden Ability:</strong> ${pokemon.HiddenAbility}</div>
                    </div>

                    <div class="pokemon-evolution">
                        <h3>Evolution Line</h3>
                        <div>${pokemon.EvolutionLine}</div>
                    </div>
                `;
            }

            // Add event listener for dropdown change
            dropdown.addEventListener('change', function(e) {
                const selectedPokemon = e.target.value;
                updatePokedexContent(selectedPokemon);
            });

            // Display first Pokémon by default
            const firstPokemon = dropdown.options[0].value;
            updatePokedexContent(firstPokemon);
        })
        .catch(error => console.error('Error loading Pokémon data:', error));
});
