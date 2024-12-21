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
    let pokemon = pokemonData.find(p => p.InternalName === decodeURIComponent(pokemonName));
    
    if (!pokemon) {
      pokemon = pokemonData.find(p => p.Name === decodeURIComponent(pokemonName));
    }
    
    if (pokemon) {
      renderPokemonData(pokemon, movesData, abilitiesData);
    } else {
      console.error(`Pokémon not found. Tried searching by InternalName: ${decodeURIComponent(pokemonName)} and Name: ${decodeURIComponent(pokemonName)}`);
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

  // Image name for the base Pokémon
  const imageName = pokemon.InternalName || pokemon.Name.replace(/\s+/g, '_');
  
  // Default image path
  pokemonImage.src = `images/Front/${imageName.toUpperCase()}.png`;
  pokemonImage.classList.add("normal-size");

  // Display Pokémon Name
  pokemonNameElement.textContent = pokemon.Name;

  // Display Pokémon Types
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

  // Render hidden ability
  if (pokemon.HiddenAbilities) {
    const hiddenAbilityKey = pokemon.HiddenAbilities.toLowerCase().replace(/\s+/g, '');
    const hiddenAbilityInfo = abilitiesData[hiddenAbilityKey];
    pokemonHiddenAbilityElement.innerHTML = `<div class="ability">
                                               <strong>${hiddenAbilityInfo ? hiddenAbilityInfo.Name : pokemon.HiddenAbilities}</strong>: 
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

  renderEvolutions(pokemon);
  
  // Load form images if available
  if (pokemon.Forms && pokemon.Forms.length > 0) {
    const formsContainer = document.getElementById("forms-container");
    formsContainer.innerHTML = '<h3>Forms:</h3>';

    pokemon.Forms.forEach((form, index) => {
      const formItem = document.createElement("div");
      formItem.classList.add("form-item");
    
      const formHeader = document.createElement("h4");
      formHeader.textContent = `Form ${index + 1}: ${form.FormName || 'Unknown'}`;
      formItem.appendChild(formHeader);
    
      const formImage = document.createElement("img");
      formImage.src = `images/Front/${imageName.toUpperCase()}_${index + 1}.png`; // Dynamically set the form image
      formImage.alt = `Form ${index + 1} of ${pokemon.Name}`;
      formImage.classList.add("form-image");
      formItem.appendChild(formImage);
    
      // Display base stats for the form
      if (form.BaseStats) {
        const statsList = document.createElement("ul");
        const statNames = ["HP", "Attack", "Defense", "Sp. Atk", "Sp. Def", "Speed"];
        
        form.BaseStats.forEach((statValue, i) => {
          const statItem = document.createElement("li");
          statItem.textContent = `${statNames[i]}: ${statValue}`;
          statsList.appendChild(statItem);
        });
    
        formItem.appendChild(statsList);
      }
    
      formsContainer.appendChild(formItem);
    });    
  }
}

function renderEvolutions(pokemon) {
  const evolutionContainer = document.getElementById("evolution-images");

  if (!evolutionContainer) {
    console.error("Element with ID 'evolution-images' not found.");
    return;
  }

  evolutionContainer.innerHTML = '';

  if (pokemon.Evolutions) {
    const evolutions = pokemon.Evolutions.split(',');

    for (let i = 0; i < evolutions.length; i += 3) {
      const evolutionName = evolutions[i];
      const evolutionMethod = evolutions[i + 1];
      const evolutionItem = evolutions[i + 2];

      const evolutionImage = document.createElement("img");
      evolutionImage.src = `images/Front/${evolutionName.toUpperCase()}.png`;
      evolutionImage.alt = evolutionName;
      evolutionImage.classList.add("evolution-image");

      evolutionImage.addEventListener("click", () => {
        window.location.href = `details.html?pokemon=${encodeURIComponent(evolutionName)}`;
      });

      const evolutionContainerItem = document.createElement("div");
      evolutionContainerItem.classList.add("evolution-container-item");
      
      evolutionContainerItem.appendChild(evolutionImage);

      const methodText = document.createElement("p");
      methodText.textContent = `Method: ${evolutionMethod} ${evolutionItem ? `(${evolutionItem})` : ''}`;
      methodText.classList.add("evolution-how");
      evolutionContainerItem.appendChild(methodText);

      evolutionContainer.appendChild(evolutionContainerItem);
    }
  } else {
    evolutionContainer.innerHTML = '<p>No evolutions available.</p>';
  }
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
  document.documentElement.classList.add('dark-mode');
} else {
  document.documentElement.classList.add('light-mode');
}


window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
  if (event.matches) {
      document.documentElement.classList.add('dark-mode');
      document.documentElement.classList.remove('light-mode');
  } else {
      document.documentElement.classList.add('light-mode');
      document.documentElement.classList.remove('dark-mode');
  }
});
