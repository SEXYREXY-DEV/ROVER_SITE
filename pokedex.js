// pokedex.js

fetch('pokedex.json')
    .then(response => response.json())
    .then(data => {
        console.log(data); // Log the data to check if it loads successfully
        const pokemonContainer = document.getElementById('pokemon-container');

        // Base path for images
        const baseImagePath = 'Front/'; // Change this based on your folder structure

        // Loop through Pokémon data and create entries
        data.forEach(pokemon => {
            const entry = document.createElement('div');
            entry.classList.add('pokemon-entry');
            entry.innerHTML = `
                <h2>${pokemon.Name}</h2>
                <img src="${baseImagePath}${pokemon.InternalName}.png" alt="${pokemon.Name} image" class="pokemon-image">
                <p><strong>Type:</strong> ${pokemon.Type1} ${pokemon.Type2 ? ' / ' + pokemon.Type2 : ''}</p>
                <p><strong>HP:</strong> ${pokemon.HP}</p>
                <p><strong>Attack:</strong> ${pokemon.Attack}</p>
                <p><strong>Defense:</strong> ${pokemon.Defense}</p>
                <p><strong>Special Attack:</strong> ${pokemon.SpAtk}</p>
                <p><strong>Special Defense:</strong> ${pokemon.SpDef}</p>
                <p><strong>Speed:</strong> ${pokemon.Spd}</p>
                <p><strong>Abilities:</strong> ${pokemon.Abilities}</p>
                <p><strong>Hidden Ability:</strong> ${pokemon.HiddenAbility}</p>
                <p><strong>Evolutions:</strong> ${pokemon.Evolutions}</p>
                <p><strong>Location Found:</strong> ${pokemon["Location Found"] || 'Not found'}</p>
                <p><strong>Evolution Line:</strong> ${pokemon["Evolution Line"]}</p>
            `;
            pokemonContainer.appendChild(entry);
        });
    })
    .catch(error => console.error('Error loading Pokémon data:', error));
