document.addEventListener("DOMContentLoaded", () => {
  const pokemonImage = document.getElementById("pokemon-image");
  const imageSelector = document.getElementById("image-selector");

  const urlParams = new URLSearchParams(window.location.search);
  const pokemonName = urlParams.get('pokemon');

  // Fetch abilities.json and moves.json data in parallel
  Promise.all([
    fetch("data/merged_pokemon.json").then(response => response.json()),
    fetch("data/abilities.json").then(response => response.json()),
    fetch("data/moves.json").then(response => response.json())
  ])
  .then(([pokemonData, abilitiesData, movesData]) => {
    const pokemon = pokemonData.find(p => p.InternalName === decodeURIComponent(pokemonName));
    if (pokemon) {
      renderPokemonData(pokemon, movesData, abilitiesData);
    } else {
      console.error("Pokémon not found");
    }
  })
  .catch(error => console.error("Error loading data:", error));

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
  pokemonImage.src = imagePath;

  if (viewType === "Icons") {
    pokemonImage.classList.remove("normal-size");
    pokemonImage.classList.add("icon-size");
  } else {
    pokemonImage.classList.remove("icon-size");
    pokemonImage.classList.add("normal-size");
  }
}

function renderPokemonData(pokemon, movesData, abilitiesData) {
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

  const types = [pokemon.Type1, pokemon.Type2].filter(Boolean);
  pokemonTypeElement.innerHTML = types
    .map(type => `<span class="type-badge ${type.toLowerCase()}">${type}</span>`)
    .join(' ');

  // Render regular abilities
  const abilitiesArray = pokemon.Abilities.split(',').map(ability => ability.trim());
  pokemonAbilitiesElement.innerHTML = abilitiesArray.map(ability => {
    const abilityKey = ability.toLowerCase().replace(/\s+/g, '');
    const abilityInfo = abilitiesData[abilityKey];
    return `<div class="ability">
              <strong>${abilityInfo ? abilityInfo.Name : ability}</strong>: 
              ${abilityInfo ? abilityInfo.Description : 'No description available'}
            </div>`;
  }).join('') || 'None';

  // Render hidden ability in the same format as regular abilities
  if (pokemon.HiddenAbility) {
    const hiddenAbilityKey = pokemon.HiddenAbility.toLowerCase().replace(/\s+/g, '');
    const hiddenAbilityInfo = abilitiesData[hiddenAbilityKey];
    pokemonHiddenAbilityElement.innerHTML = `<div class="ability">
                                               <strong>${hiddenAbilityInfo ? hiddenAbilityInfo.Name : pokemon.HiddenAbility}</strong>: 
                                               ${hiddenAbilityInfo ? hiddenAbilityInfo.Description : 'No description available'}
                                             </div>`;
  } else {
    pokemonHiddenAbilityElement.textContent = 'None';
  }

  pokemonPokedexElement.textContent = pokemon.Pokedex || 'No entry available';

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
  { stat: 'Sp. Atk', value: pokemon.BaseStats[4] },
  { stat: 'Sp. Def', value: pokemon.BaseStats[5] },
  { stat: 'Speed', value: pokemon.BaseStats[3] }
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
    <td>${move.Power ||'-'}</td>
    <td>${move.Accuracy || '-'}</td>
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

if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  // User prefers dark mode
  document.documentElement.classList.add('dark-mode');
} else {
  // User prefers light mode
  document.documentElement.classList.add('light-mode');
}

// Optional: Listen for changes in dark mode preference
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
  if (event.matches) {
      // Dark mode activated
      document.documentElement.classList.add('dark-mode');
      document.documentElement.classList.remove('light-mode');
  } else {
      // Light mode activated
      document.documentElement.classList.add('light-mode');
      document.documentElement.classList.remove('dark-mode');
  }
});
