// pokedex.js

// Function to load JSON data
fetch('pokedex.json')
    .then(response => response.json())
    .then(data => {
        const pokemonContainer = document.getElementById('pokemon-container');

        // Loop through Pokémon data and create entries
        data.forEach(pokemon => {
            const entry = document.createElement('div');
            entry.classList.add('pokemon-entry');
            entry.innerHTML = `
                <img src="${pokemon.image}" alt="${pokemon.name}">
                <h2>#${pokemon.id.toString().padStart(3, '0')} ${pokemon.name}</h2>
                <p>Type: ${pokemon.type1} ${pokemon.type2 ? ' / ' + pokemon.type2 : ''}</p>
                <h3>Base Stats:</h3>
                <ul>
                    <li>HP: ${pokemon.hp}</li>
                    <li>Attack: ${pokemon.attack}</li>
                    <li>Defense: ${pokemon.defense}</li>
                    <li>Sp. Attack: ${pokemon.spAtk}</li>
                    <li>Sp. Defense: ${pokemon.spDef}</li>
                    <li>Speed: ${pokemon.speed}</li>
                </ul>
                <h3>Moves:</h3>
                <ul>
                    ${pokemon.moves.split(',').map(move => `<li>${move}</li>`).join('')}
                </ul>
            `;
            pokemonContainer.appendChild(entry);
        });
    })
    .catch(error => console.error('Error loading Pokémon data:', error));
