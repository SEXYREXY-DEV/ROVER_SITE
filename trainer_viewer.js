// trainer_viewer.js

// Use page-specified game if available, otherwise fall back to ss2.
const game = window.game || 'ss2';

let allTrainers = [];
let allTypes = [];
let allPokemon = [];

window.addEventListener('DOMContentLoaded', async () => {
  try {
    [allTrainers, allTypes, allPokemon] = await Promise.all([
      fetch(`./games/${game}/data/trainers.json`).then(res => res.json()),
      fetch(`./games/${game}/data/types.json`).then(res => res.json()),
      fetch(`./games/${game}/data/pokemon_master_evo.json`).then(res => res.json())
    ]);

    renderTrainers(allTrainers);
    setupSearch();
  } catch (err) {
    console.error('Error loading data:', err);
  }
});

function renderTrainers(trainers) {
  const container = document.getElementById('trainers-container');
  container.innerHTML = '';

  trainers.forEach(trainer => {
    const card = document.createElement('div');
    card.className = 'trainer-card';

    let isTrainerCanon = false;

    // Canon logic for RIVAL_Artie
    if (trainer.Type === 'RIVAL_Artie') {
      if (trainer.Number === 0 || trainer.Number === 1 || (trainer.Number >= 4 && (trainer.Number - 4) % 4 === 0)) {
        isTrainerCanon = true;
      }
    }
    // Canon logic for EGADMIN_Angelo
    else if (trainer.Type === 'EGADMIN_Angelo' && (trainer.Number === 0 || trainer.Number === 4 || trainer.Number === 5)) {
      isTrainerCanon = true;
    }
    else if (trainer.Type === 'EGADMIN_Claude' && (trainer.Number === 0 || trainer.Number === 4)) {
      isTrainerCanon = true;
    }
    else if (trainer.Number === 0) {
      isTrainerCanon = true;
    }

    trainer.isCanon = isTrainerCanon;

    const trainerTypeKey = trainer.Type || '000';
    const imageUrl = `./games/${game}/images/Trainers/${trainerTypeKey}.png`;
    const trainerImage = document.createElement('img');
    trainerImage.className = 'trainer-avatar';
    trainerImage.src = imageUrl;
    trainerImage.alt = trainerTypeKey;
    trainerImage.onerror = function () {
      this.onerror = null;
      this.src = `./games/${game}/images/Trainers/000.png`;
    };

    const detailsPanel = document.createElement('div');
    detailsPanel.className = 'trainer-expanded-details';
    detailsPanel.style.display = 'none';

    card.innerHTML = `
      <div class="trainer-name">${trainer.Name || 'Unknown'} ${isTrainerCanon ? '<span class="canon-flag">Canon</span>' : ''}</div>
      <div class="trainer-class">${trainer.Type || 'Unknown'}</div>
      <div class="trainer-pokemon-count">${Array.isArray(trainer.Pokemon) ? trainer.Pokemon.length : 0} Pokémon</div>
      <div class="trainer-max-level">Max Level: ${Math.max(...(Array.isArray(trainer.Pokemon) ? trainer.Pokemon.map(p => p.Level || 0) : [0]))}</div>
    `;

    card.appendChild(trainerImage);
    card.appendChild(detailsPanel);

    card.addEventListener('click', () => {
      const isOpen = card.classList.toggle('expanded');
      document.querySelectorAll('.trainer-card').forEach(otherCard => {
        if (otherCard !== card) otherCard.classList.remove('expanded');
      });

      if (!isOpen) {
        detailsPanel.style.display = 'none';
      } else {
        populateTrainerDetails(detailsPanel, trainer);
        detailsPanel.style.display = 'block';
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    container.appendChild(card);
  });
}

function populateTrainerDetails(detailsPanel, trainer) {
  detailsPanel.innerHTML = ''; // Clear previous content

  const leftPanel = document.createElement('div');
  leftPanel.className = 'trainer-left-panel';

  const trainerTypeKey = trainer.Type || '000';
  const imageUrl = `./games/${game}/images/Trainers/${trainerTypeKey}.png`;
  const trainerImage = document.createElement('img');
  trainerImage.className = 'trainer-avatar-expanded';
  trainerImage.src = imageUrl;
  trainerImage.alt = trainerTypeKey;
  trainerImage.onerror = function () {
    this.onerror = null;
    this.src = `./games/${game}/images/Trainers/000.png`; // Default fallback
  };

  const trainerName = document.createElement('div');
  trainerName.className = 'trainer-name-expanded';
  trainerName.textContent = trainer.Name || 'Unknown';

  const trainerClass = document.createElement('div');
  trainerClass.className = 'trainer-class-expanded';
  trainerClass.textContent = trainer.Type || 'Unknown';

  const maxLevel = Math.max(...(Array.isArray(trainer.Pokemon) ? trainer.Pokemon.map(p => p.Level || 0) : [0]));
  const trainerMaxLevel = document.createElement('div');
  trainerMaxLevel.className = 'trainer-max-level-expanded';
  trainerMaxLevel.textContent = `Max Level: ${maxLevel}`;

  leftPanel.appendChild(trainerImage);
  leftPanel.appendChild(trainerName);
  leftPanel.appendChild(trainerClass);
  leftPanel.appendChild(trainerMaxLevel);

  const rightPanel = document.createElement('div');
  rightPanel.className = 'trainer-right-panel';

  if (!Array.isArray(trainer.Pokemon) || trainer.Pokemon.length === 0) {
    rightPanel.innerHTML = '<p>No Pokémon data for this trainer.</p>';
  } else {
    const pokemonList = document.createElement('div');
    pokemonList.className = 'pokemon-list';

    trainer.Pokemon.forEach((pokemon) => {
      const item = document.createElement('div');
      item.className = 'pokemon-item';

      let isCanon = false;

      if (trainer.Type === 'RIVAL_Artie') {
        if (trainer.Number === 0 || trainer.Number === 1 || (trainer.Number >= 4 && (trainer.Number - 4) % 4 === 0)) {
          isCanon = true;
        }
      } else if (trainer.Type === 'EGADMIN_Angelo' && (trainer.Number === 0 || trainer.Number === 4 || trainer.Number === 5)) {
        isCanon = true;
      } else if (trainer.Type === 'EGADMIN_Claude' && (trainer.Number === 0 || trainer.Number === 4)) {
      isCanon = true;
      } else {
        if (trainer.Number === 0) {
          isCanon = true;
        } else {
          isCanon = false;
        }
      }

      // Pokémon details HTML
      const pokemonImage = document.createElement('img');
      pokemonImage.className = 'pokemon-image';
      pokemonImage.src = `./games/${game}/images/Front/${pokemon.Species}.png`;
      pokemonImage.alt = pokemon.Species;
      pokemonImage.onerror = function () {
        this.onerror = null;
        this.src = `./games/${game}/images/Front/${pokemon.Species}T.png`; // Fallback
      };

      const pokemonData = allPokemon.find(p => p.InternalName === pokemon.Species);
      if (!pokemonData) {
        console.warn(`No data found for ${pokemon.Species}`);
        return;
      }

      const types = [pokemonData.Type1, pokemonData.Type2].filter(t => t);
      const effectiveness = getTypeEffectiveness(types);

      const baseStats = pokemonData.BaseStats || [];
      const [hp, atk, def, speed, spatk, spdef] = baseStats.map(x => x || 'N/A');

      item.innerHTML = `
        <div class="pokemon-header">
          <div class="pokemon-name">${pokemon.Species} (Lv. ${pokemon.Level || 'N/A'}) ${isCanon ? '<span class="canon-flag">Canon</span>' : ''}</div>
        </div>
        <div class="pokemon-details">
          <div class="pokemon-detail"><span>Nature:</span> <span>${pokemon.Nature || 'N/A'}</span></div>
          <div class="pokemon-detail"><span>Item:</span> <span>${pokemon.Item || 'None'}</span></div>
          <div class="pokemon-detail"><span>IVs:</span> <span>${formatStat(pokemon.IV || pokemon.IVs)}</span></div>
          <div class="pokemon-detail"><span>EVs:</span> <span>${formatStat(pokemon.EV || pokemon.EVs)}</span></div>
          <div class="pokemon-detail"><span>Moves:</span> <span>${pokemon.Moves ? pokemon.Moves.join(', ') : 'N/A'}</span></div>
        </div>
        <div class="pokemon-stats">
          <div>HP: ${hp}</div>
          <div>ATK: ${atk}</div>
          <div>DEF: ${def}</div>
          <div>SPATK: ${spatk}</div>
          <div>SPDEF: ${spdef}</div>
          <div>SPE: ${speed}</div>
        </div>
        <div class="weakness-icons">
          ${effectiveness.weaknesses.map(type => `<img src="./games/${game}/images/Types/${type}.png" class="type-icon" title="${type}" alt="${type}">`).join('')}
        </div>
      `;

      item.insertBefore(pokemonImage, item.firstChild);
      pokemonList.appendChild(item);
    });

    rightPanel.appendChild(pokemonList);
  }

  detailsPanel.appendChild(leftPanel);
  detailsPanel.appendChild(rightPanel);
}

function setupSearch() {
  const searchInput = document.getElementById('search-bar');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    
    // Filter the trainers based on the query for both Name and Type
    const filtered = allTrainers.filter(trainer => {
        // Check if trainer has Name and Type, if not, default to empty string
        const name = trainer.Name ? trainer.Name.toLowerCase() : '';
        const type = trainer.Type ? trainer.Type.toLowerCase() : '';
        
        // Return true if either Name or Type includes the query
        return name.includes(query) || type.includes(query);
    });

    // Render the filtered trainers
    renderTrainers(filtered);
    });

  const resetButton = document.getElementById('reset-button');
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      searchInput.value = '';
      renderTrainers(allTrainers);
      document.getElementById('trainer-details').style.display = 'none';
    });
  }
}

function formatStat(stat) {
  if (stat == null) return 'N/A';
  if (Array.isArray(stat)) return stat.join('/');
  if (typeof stat === 'object') return Object.values(stat).join('/');
  return String(stat);
}

function getTypeEffectiveness(types) {
  const effectiveness = {};

  types.forEach(type => {
    const typeObj = allTypes.find(t => t.Name === type);
    if (!typeObj) return;

    (typeObj.Weaknesses || []).forEach(t => {
      if (effectiveness[t] !== 0) {
        effectiveness[t] = (effectiveness[t] || 1) * 2;
      }
    });

    (typeObj.Resistances || []).forEach(t => {
      if (effectiveness[t] !== 0) {
        effectiveness[t] = (effectiveness[t] || 1) * 0.5;
      }
    });

    (typeObj.Immunities || []).forEach(t => {
      effectiveness[t] = 0;
    });
  });

  const weaknesses = [];

  for (const [type, multiplier] of Object.entries(effectiveness)) {
    if (multiplier === 2) {
      weaknesses.push(type);
    }
  }

  return { weaknesses };
}
