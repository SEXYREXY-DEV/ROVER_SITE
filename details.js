document.addEventListener("DOMContentLoaded", () => {
    const pokemonImage = document.getElementById("pokemon-image");
    const imageSelector = document.getElementById("image-selector");

    // Get Pokémon name from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const pokemonName = urlParams.get('pokemon');

    fetch("data/merged_pokemon.json")
      .then(response => response.json())
      .then(data => {
        const pokemon = data.find(p => p.InternalName === decodeURIComponent(pokemonName));
        if (pokemon) {
          fetch("data/moves.json")  // Fetch the moves data
            .then(response => response.json())
            .then(movesData => {
              renderPokemonData(pokemon, movesData); // Pass moves data to the render function
            })
            .catch(error => console.error("Error loading moves data:", error));
        } else {
          console.error("Pokémon not found");
        }
      })
      .catch(error => console.error("Error loading Pokémon data:", error));

    // Update the image and size when dropdown selection changes
    imageSelector.addEventListener("change", (event) => {
      if (pokemonName) {
        updatePokemonImage(pokemonName, event.target.value);
      }
    });
});

function updatePokemonImage(pokemonName, viewType) {
    const pokemonImage = document.getElementById("pokemon-image");
    const imageName = pokemonName.replace(/\s+/g, '_');
    const imagePath = `images/${viewType.toLowerCase()}/${imageName}.png`;
    pokemonImage.src = imagePath;

    // Apply appropriate size class based on the selected view
    if (viewType.toLowerCase() === "icons") {
        pokemonImage.classList.remove("normal-size");
        pokemonImage.classList.add("icon-size");
    } else {
        pokemonImage.classList.remove("icon-size");
        pokemonImage.classList.add("normal-size");
    }
}

// Function to render Pokémon data
function renderPokemonData(pokemon, movesData) {
  const pokemonImage = document.getElementById("pokemon-image");
  const pokemonNameElement = document.getElementById("pokemon-name");
  const pokemonTypeElement = document.getElementById("pokemon-type");
  const pokemonBaseStatsElement = document.getElementById("pokemon-base-stats");
  const pokemonOtherStatsElement = document.getElementById("pokemon-other-stats");
  const pokemonAbilitiesElement = document.getElementById("pokemon-abilities");
  const pokemonHiddenAbilityElement = document.getElementById("pokemon-hidden-ability");
  const pokemonEvolutionsElement = document.getElementById("pokemon-evolutions");
  const pokemonPokedexElement = document.getElementById("pokemon-pokedex");

  // Set initial image to 'front'
  const imageName = pokemon.InternalName || pokemon.Name.replace(/\s+/g, '_');
  pokemonImage.src = `images/front/${imageName}.png`;

  // Apply initial size based on 'front' view
  pokemonImage.classList.add("normal-size"); // Set this to the default size class for 'front'

  // Set Pokémon information
  pokemonNameElement.textContent = pokemon.Name;
  pokemonTypeElement.textContent = `${pokemon.Type1}${pokemon.Type2 ? ' / ' + pokemon.Type2 : ''}`;

  // Render Base Stats dynamically into the table
  const baseStatsBody = document.getElementById("base-stats-body");
  baseStatsBody.innerHTML = ''; // Clear existing stats
  const baseStats = [
    { stat: 'HP', value: pokemon.BaseStats[0] },
    { stat: 'Attack', value: pokemon.BaseStats[1] },
    { stat: 'Defense', value: pokemon.BaseStats[2] },
    { stat: 'Sp. Atk', value: pokemon.BaseStats[3] },
    { stat: 'Sp. Def', value: pokemon.BaseStats[4] },
    { stat: 'Speed', value: pokemon.BaseStats[5] }
  ];

  baseStats.forEach(stat => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${stat.stat}</td>
      <td>${stat.value || 'N/A'}</td>
    `;
    baseStatsBody.appendChild(row);
  });

  // Render Other Stats dynamically into the table
  const otherStatsBody = document.getElementById("other-stats-body");
  otherStatsBody.innerHTML = ''; // Clear existing other stats
  const otherStats = [
    { stat: 'Rareness', value: pokemon.Rareness },
    { stat: 'Happiness', value: pokemon.Happiness },
    { stat: 'Growth Rate', value: pokemon.GrowthRate },
    { stat: 'Steps to Hatch', value: pokemon.StepsToHatch },
    { stat: 'Height', value: `${pokemon.Height} m` },
    { stat: 'Weight', value: `${pokemon.Weight} kg` },
    { stat: 'Color', value: pokemon.Color },
    { stat: 'Shape', value: pokemon.Shape }
  ];

  otherStats.forEach(stat => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${stat.stat}</td>
      <td>${stat.value || 'N/A'}</td>
    `;
    otherStatsBody.appendChild(row);
  });

  // Process abilities
  const abilitiesArray = pokemon.Abilities.split(',').map(ability => ability.trim());
  pokemonAbilitiesElement.textContent = abilitiesArray.join(', ') || 'None';

  // Set hidden ability
  pokemonHiddenAbilityElement.textContent = pokemon.HiddenAbility || 'None';

  // Process moves and display them in a table
  const movesTableBody = document.getElementById("moves-table-body");
  movesTableBody.innerHTML = ''; // Clear existing moves

  for (let i = 0; i < pokemon.Moves.length; i += 2) {
    const levelLearned = pokemon.Moves[i];
    const moveName = pokemon.Moves[i + 1];
    
    // Find the move definition from movesData
    const move = movesData.find(m => m.Name === moveName);
    const moveType = move ? move.Type : 'N/A';
    const moveCategory = move ? move.Category : 'N/A';
    const movePower = move ? move.Power : 'N/A';
    const moveAccuracy = move ? move.Accuracy : 'N/A';
    const moveDescription = move ? move.Description : 'No description available';

    // Create a new row for the move
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${levelLearned}</td>
      <td>${moveType}</td>
      <td>${moveCategory}</td>
      <td>${movePower}</td>
      <td>${moveAccuracy}</td>
      <td>${moveDescription}</td>
    `;

    // Append the row to the table body
    movesTableBody.appendChild(row);
  }

  // Set evolutions
  pokemonEvolutionsElement.textContent = pokemon.Evolutions || 'None';

  // Set Pokédex entry
  pokemonPokedexElement.textContent = pokemon.Pokedex || 'No entry available';

  // Show the info section
  document.getElementById("pokemon-info").style.display = "block";
}
