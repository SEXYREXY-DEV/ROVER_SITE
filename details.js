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
            renderPokemonData(pokemon, movesData);
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
  const imageName = pokemonName;
  const imagePath = `images/${viewType}/${imageName.toUpperCase()}.png`;
  console.log(`${viewType}`);
  pokemonImage.src = imagePath;

  if (viewType.charAt(0).toUpperCase() === "Icons") {
      pokemonImage.classList.remove("normal-size");
      pokemonImage.classList.add("icon-size");
  } else {
      pokemonImage.classList.remove("icon-size");
      pokemonImage.classList.add("normal-size");
  }
}

function renderPokemonData(pokemon, movesData) {
const pokemonImage = document.getElementById("pokemon-image");
const pokemonNameElement = document.getElementById("pokemon-name");
const pokemonTypeElement = document.getElementById("type-description");
const pokemonAbilitiesElement = document.getElementById("abilities-description");
const pokemonHiddenAbilityElement = document.getElementById("hidden-ability-description");
const pokemonPokedexElement = document.getElementById("pokedex-entry");

const imageName = pokemon.InternalName || pokemon.Name.replace(/\s+/g, '_');
pokemonImage.src = `images/Front/${imageName.toUpperCase()}.png`;
pokemonImage.classList.add("normal-size");

pokemonNameElement.textContent = pokemon.Name;

// Display Types with color badges
const types = [pokemon.Type1, pokemon.Type2].filter(Boolean);
pokemonTypeElement.innerHTML = types
  .map(type => `<span class="type-badge ${type.toLowerCase()}">${type}</span>`)
  .join(' ');

// Display abilities
const abilitiesArray = pokemon.Abilities.split(',').map(ability => ability.trim());
pokemonAbilitiesElement.innerHTML = abilitiesArray.join(', ') || 'None';

// Set hidden ability
pokemonHiddenAbilityElement.textContent = pokemon.HiddenAbility || 'None';

// Set Pokédex entry
pokemonPokedexElement.textContent = pokemon.Pokedex || 'No entry available';

// Show base stats, moves, and other stats as needed
renderStatsTable(pokemon);
renderMovesTable(pokemon, movesData);
renderOtherStatsTable(pokemon);

document.getElementById("pokemon-info").style.display = "block";
}

function renderStatsTable(pokemon) {
const baseStatsBody = document.getElementById("base-stats-body");
baseStatsBody.innerHTML = '';
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
  row.innerHTML = `<td>${stat.stat}</td><td>${stat.value || 'N/A'}</td>`;
  baseStatsBody.appendChild(row);
});
}

function renderMovesTable(pokemon, movesData) {
const movesTableBody = document.getElementById("moves-table-body");
movesTableBody.innerHTML = '';
for (let i = 0; i < pokemon.Moves.length; i += 2) {
  const levelLearned = pokemon.Moves[i];
  const moveName = pokemon.Moves[i + 1];
  const move = movesData.find(m => m.Name === moveName) || {};
  const typeImage = move.Type ? `<img src="images/Types/${move.Type.toUpperCase()}.png" alt="${move.Type} Type" class="type-icon">` : 'N/A';
  const categoryImage = move.Category ? `<img src="images/Moves/${move.Category.toUpperCase()}.png" alt="${move.Category} Type" class="category-icon">` : 'N/A';
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${moveName}</td>
    <td>${levelLearned}</td>
    <td>${typeImage}</td>
    <td>${categoryImage}</td>
    <td>${move.Power || 'N/A'}</td>
    <td>${move.Accuracy || 'N/A'}</td>
    <td>${move.Description || 'No description available'}</td>
  `;
  movesTableBody.appendChild(row);
}
}

function renderOtherStatsTable(pokemon) {
const otherStatsBody = document.getElementById("other-stats-body");
otherStatsBody.innerHTML = '';
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
  row.innerHTML = `<td>${stat.stat}</td><td>${stat.value || 'N/A'}</td>`;
  otherStatsBody.appendChild(row);
});
}
