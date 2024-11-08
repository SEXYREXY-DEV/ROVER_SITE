document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("pokemon-container");
    const searchBar = document.getElementById("search-bar");

    // Fetch Pokémon data
    fetch("data/merged_pokemon.json")
        .then(response => response.json())
        .then(data => {
            // Store the full Pokémon data for later use
            const allPokemon = data;

            // Function to display Pokémon cards based on filtered data
            function displayPokemon(pokemonData) {
                container.innerHTML = ''; // Clear current Pokémon cards
                pokemonData.forEach(pokemon => {
                    const baseCard = createPokemonCard(getBasePokemonData(pokemon)); // Display base Pokémon card
                    container.appendChild(baseCard);

                    // Display cards for each form if available
                    //if (pokemon.Forms && pokemon.Forms.length > 0) {
                    //    pokemon.Forms.forEach(form => {
                    //        const formCard = createPokemonCard(form, pokemon); // Pass base Pokémon for shared data
                    //        container.appendChild(formCard);
                    //    });
                    //}
                });
            }

            // Initial display of all Pokémon
            displayPokemon(allPokemon);

            // Search functionality
            searchBar.addEventListener("input", () => {
                const searchQuery = searchBar.value.toLowerCase().trim();

                // Filter Pokémon based on search query
                const filteredPokemon = allPokemon.filter(pokemon => {
                    const name = pokemon.Name.toLowerCase();
                    return name.includes(searchQuery); // Match if name contains search query
                });

                // Display the filtered Pokémon
                displayPokemon(filteredPokemon);
            });
        })
        .catch(error => console.error("Error loading Pokémon data:", error));
});

// 1. Define the function to extract base Pokémon data
function getBasePokemonData(pokemonData) {
    // Return base Pokémon data even if it has forms
    return {
        Name: pokemonData.Name,
        InternalName: pokemonData.InternalName,
        Type1: pokemonData.Type1,
        Type2: pokemonData.Type2,
        BaseStats: pokemonData.BaseStats,
        GenderRate: pokemonData.GenderRate,
        GrowthRate: pokemonData.GrowthRate,
        BaseEXP: pokemonData.BaseEXP,
        EffortPoints: pokemonData.EffortPoints,
        Rareness: pokemonData.Rareness,
        Happiness: pokemonData.Happiness,
        Abilities: pokemonData.Abilities,
        HiddenAbility: pokemonData.HiddenAbility,
        Moves: pokemonData.Moves,
        TutorMoves: pokemonData.TutorMoves,
        Compatibility: pokemonData.Compatibility,
        StepsToHatch: pokemonData.StepsToHatch,
        Height: pokemonData.Height,
        Weight: pokemonData.Weight,
        Color: pokemonData.Color,
        Shape: pokemonData.Shape,
        Kind: pokemonData.Kind,
        Pokedex: pokemonData.Pokedex,
        Generation: pokemonData.Generation,
        BattlerPlayerX: pokemonData.BattlerPlayerX,
        BattlerPlayerY: pokemonData.BattlerPlayerY,
        BattlerEnemyX: pokemonData.BattlerEnemyX,
        BattlerEnemyY: pokemonData.BattlerEnemyY,
        BattlerShadowX: pokemonData.BattlerShadowX,
        BattlerShadowSize: pokemonData.BattlerShadowSize
    };
}

function renderPokemonData(pokemon) {
    document.getElementById("pokemon-name").textContent = pokemon.Name;
    document.getElementById("pokemon-type").textContent = `Type: ${pokemon.Type1}${pokemon.Type2 ? ' / ' + pokemon.Type2 : ''}`;
    document.getElementById("pokemon-hp").textContent = `HP: ${pokemon.BaseStats[0] || 'N/A'}`;
    document.getElementById("pokemon-attack").textContent = `Attack: ${pokemon.BaseStats[1] || 'N/A'}`;
    document.getElementById("pokemon-defense").textContent = `Defense: ${pokemon.BaseStats[2] || 'N/A'}`;
    document.getElementById("pokemon-sp-atk").textContent = `Sp. Atk: ${pokemon.BaseStats[3] || 'N/A'}`;
    document.getElementById("pokemon-sp-def").textContent = `Sp. Def: ${pokemon.BaseStats[4] || 'N/A'}`;
    document.getElementById("pokemon-speed").textContent = `Speed: ${pokemon.BaseStats[5] || 'N/A'}`;

    const abilitiesArray = Array.isArray(pokemon.Abilities) ? pokemon.Abilities : [pokemon.Abilities];
    document.getElementById('pokemon-abilities').textContent = abilitiesArray.filter(Boolean).join(', ') || 'None';
    document.getElementById('pokemon-hidden-ability').textContent = pokemon.HiddenAbility ? pokemon.HiddenAbility : 'None';
    document.getElementById("pokemon-info").style.display = "block";
}


function createPokemonCard(pokemon, basePokemon = null) {
    const card = document.createElement("div");
    card.classList.add("pokemon-card");

    // Determine Pokémon types
    let types = [];
    if (pokemon.Types) {
        types = pokemon.Types.split(","); // Split if 'Types' is a comma-separated string
    } else {
        types.push(pokemon.Type1 || ""); // Add Type1 if it exists
        if (pokemon.Type2) types.push(pokemon.Type2); // Add Type2 if it exists
    }
    types = types.filter(Boolean); // Remove any empty strings

    // Get colors for types
    const type1Color = getTypeColor(types[0]);
    const type2Color = types[1] ? getTypeColor(types[1]) : type1Color;

    // Apply background gradient based on types
    card.style.background = types[1]
        ? `linear-gradient(90deg, ${type1Color} 50%, ${type2Color} 50%)`
        : type1Color;

    // Info container
    const info = document.createElement("div");
    info.classList.add("pokemon-info");

    // Add Name (include form name if it's a form)
    const name = document.createElement("h2");
    name.textContent = pokemon.Name || pokemon.InternalName;
    if (basePokemon) name.textContent += ` (${pokemon.FormName || "Form"})`;

    // Add Pokémon Image
    const image = document.createElement("img");
    image.classList.add("pokemon-image");
    const imageName = pokemon.InternalName || pokemon.Name;
    image.src = `images/front/${imageName.toUpperCase()}.png`;
    image.alt = name.textContent;

    // Add Type
    const type = document.createElement("p");
    type.textContent = `Type: ${types.join(", ") || "Unknown"}`;

    // Extract base stats
    const baseStats = pokemon.BaseStats || [];
    const hp = baseStats[0] || "N/A";
    const attack = baseStats[1] || "N/A";
    const defense = baseStats[2] || "N/A";
    const speed = baseStats[3] || "N/A";
    const spAtk = baseStats[4] || "N/A";
    const spDef = baseStats[5] || "N/A";

    // Stats section
    const stats = document.createElement("div");
    stats.classList.add("pokemon-stats");
    stats.innerHTML = `
        <div><span class="stat-name">HP</span><br><span class="stat-value">${hp}</span></div>
        <div><span class="stat-name">Atk</span><br><span class="stat-value">${attack}</span></div>
        <div><span class="stat-name">Def</span><br><span class="stat-value">${defense}</span></div>
        <div><span class="stat-name">Spd</span><br><span class="stat-value">${speed}</span></div>
        <div><span class="stat-name">SpAtk</span><br><span class="stat-value">${spAtk}</span></div>
        <div><span class="stat-name">SpDef</span><br><span class="stat-value">${spDef}</span></div>
    `;
    card.addEventListener("click", () => {
        // Use the Pokémon's InternalName or ID to navigate
        const pokemonName = encodeURIComponent(pokemon.InternalName);
        window.location.href = `details.html?pokemon=${pokemonName}`; // Redirect to details page
    });
    // Abilities section
    const abilities = document.createElement("div");
    abilities.classList.add("pokemon-abilities");

    const abilitiesArray = Array.isArray(pokemon.Abilities) ? pokemon.Abilities : [pokemon.Abilities];
    const abilitiesText = `Abilities: ${abilitiesArray.filter(Boolean).join(", ") || "None"}`;
    const hiddenAbilityText = pokemon.HiddenAbility ? `Hidden Ability: ${pokemon.HiddenAbility}` : "";

    abilities.innerHTML = `<p>${abilitiesText}</p><p>${hiddenAbilityText}</p>`;

    // Append elements to info section
    info.appendChild(name);
    info.appendChild(type);
    info.appendChild(stats);
    info.appendChild(abilities);

    // Append image and info to card
    card.appendChild(image);
    card.appendChild(info);

    return card;
}

// Function to get color based on type
function getTypeColor(type) {
    const typeColors = {
        NORMAL: '#A8A878', FIRE: '#F08030', WATER: '#6890F0', ELECTRIC: '#F8D030',
        GRASS: '#78C850', ICE: '#98D8D8', FIGHTING: '#C03028', POISON: '#A040B0',
        GROUND: '#E8D68A', FLYING: '#A890F0', PSYCHIC: '#F85888', BUG: '#A8B820',
        ROCK: '#B8A038', GHOST: '#705898', DRAGON: '#7038F8', DARK: '#705848',
        STEEL: '#B8B8D0', FAIRY: '#F0B6F0', UNKNOWN: '#000000', SHADOW: '#000000',
        QMARKS: '#000000',
    };
    return typeColors[type?.toUpperCase()] || '#ccc';
}

// Set Pokémon information
pokemonInfo.innerHTML = `
    <h1>${pokemon.Name}</h1>
    <p>Type: ${pokemon.Type1}${pokemon.Type2 ? ' / ' + pokemon.Type2 : ''}</p>
    <p>HP: ${pokemon.HP}</p>
    <p>Attack: ${pokemon.Attack}</p>
    <p>Defense: ${pokemon.Defense}</p>
    <p>Sp. Atk: ${pokemon.SpAtk}</p>
    <p>Sp. Def: ${pokemon.SpDef}</p>
    <p>Speed: ${pokemon.Spd}</p>
`;

// Set abilities and hidden ability
document.getElementById('pokemon-abilities').textContent = pokemon.Abilities.map(ability => ability.name).join(', ');
document.getElementById('pokemon-hidden-ability').textContent = pokemon.HiddenAbility ? pokemon.HiddenAbility.split(' - ')[0] : 'None';
