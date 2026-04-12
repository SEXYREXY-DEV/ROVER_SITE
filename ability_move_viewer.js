const abilitiesContainer = document.getElementById('abilities-results');
const movesContainer = document.getElementById('moves-results');

let abilitiesList = [];
let movesList = [];
let allPokemon = [];
let moveToPokemon = new Map();
let abilityToPokemon = new Map();

function getTypeColor(type) {
  const typeColors = {
    NORMAL: '#A8A878', FIRE: '#F08030', WATER: '#6890F0', ELECTRIC: '#F8D030',
    GRASS: '#78C850', ICE: '#98D8D8', FIGHTING: '#C03028', POISON: '#A040B0',
    GROUND: '#E8D68A', FLYING: '#A890F0', PSYCHIC: '#F85888', BUG: '#A8B820',
    ROCK: '#B8A038', GHOST: '#705898', DRAGON: '#7038F8', DARK: '#705848',
    STEEL: '#B8B8D0', FAIRY: '#F0B6F0', UNKNOWN: '#000000', SHADOW: '#000000',
    QMARKS: '#68A090', COSMIC: '#15416A', LIGHT: '#FFE08B', SOUND: '#A22FD3'
  };
  return typeColors[type?.toUpperCase()] || '#ccc';
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
}

function getPokemonForAbility(abilityName) {
  const normalizedAbility = abilityName.replace(/\s+/g, '').toLowerCase();
  const pokemonNames = Array.from(abilityToPokemon.get(normalizedAbility) || []);
  return pokemonNames.map(name => allPokemon.find(p => p.InternalName === name)).filter(Boolean);
}

function getPokemonForMove(moveName) {
  const normalizedMove = moveName.replace(/\s+/g, '').toLowerCase();
  const pokemonNames = Array.from(moveToPokemon.get(normalizedMove) || []);
  return pokemonNames.map(name => allPokemon.find(p => p.InternalName === name)).filter(Boolean);
}

loadData();

async function loadData() {
  try {
    const [a, m, p] = await Promise.all([
      fetch(`./games/${window.game}/data/abilities.json`),
      fetch(`./games/${window.game}/data/moves.json`),
      fetch(`./games/${window.game}/data/pokemon_master_evo.json`)
    ]);

    abilitiesList = await a.json();
    movesList = await m.json();
    allPokemon = await p.json();

    // Build indexes for fast lookup
    allPokemon.forEach(p => {
      // Abilities
      const abilities = Array.isArray(p.Abilities) ? p.Abilities : (p.Abilities ? p.Abilities.split(',').map(a => a.trim()) : []);
      const hidden = Array.isArray(p.HiddenAbility) ? p.HiddenAbility : (p.HiddenAbility ? p.HiddenAbility.split(',').map(a => a.trim()) : []);
      [...abilities, ...hidden].forEach(a => {
        const norm = a.replace(/\s+/g, '').toLowerCase();
        if (!abilityToPokemon.has(norm)) abilityToPokemon.set(norm, new Set());
        abilityToPokemon.get(norm).add(p.InternalName);
      });

      // Moves
      // Level up
      if (Array.isArray(p.Moves)) {
        for (let i = 1; i < p.Moves.length; i += 2) {
          const norm = p.Moves[i].replace(/\s+/g, '').toLowerCase();
          if (!moveToPokemon.has(norm)) moveToPokemon.set(norm, new Set());
          moveToPokemon.get(norm).add(p.InternalName);
        }
      }
      // Tutor
      if (Array.isArray(p.TutorMoves)) {
        p.TutorMoves.forEach(m => {
          const norm = m.replace(/\s+/g, '').toLowerCase();
          if (!moveToPokemon.has(norm)) moveToPokemon.set(norm, new Set());
          moveToPokemon.get(norm).add(p.InternalName);
        });
      }
      // Egg
      let eggMoves = [];
      if (typeof p.EggMoves === 'string') {
        eggMoves = p.EggMoves.split(',').map(m => m.trim());
      } else if (Array.isArray(p.EggMoves)) {
        eggMoves = p.EggMoves;
      }
      eggMoves.forEach(m => {
        const norm = m.replace(/\s+/g, '').toLowerCase();
        if (!moveToPokemon.has(norm)) moveToPokemon.set(norm, new Set());
        moveToPokemon.get(norm).add(p.InternalName);
      });
    });

    render();
    updateTabVisibility();
    document.querySelector(`#tab-container .tab-button[data-tab="${currentTab}"]`).classList.add('active');
    document.querySelectorAll('#tab-container .tab-button').forEach(btn => {
      if (btn.dataset.tab !== currentTab) btn.classList.remove('active');
    });
    
    // Highlight specific move or ability from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const highlightMove = urlParams.get('move');
    const highlightAbility = urlParams.get('ability');
    
    if (highlightMove) {
      currentTab = 'moves';
      updateTabVisibility();
      render();
      const cards = movesContainer.querySelectorAll('.pokemon-card');
      for (const card of cards) {
        const cardName = card.querySelector('h2').textContent.trim().split(' ')[0];
        if (cardName === highlightMove) {
          setTimeout(() => {
            card.scrollIntoView({ behavior: 'smooth' });
            card.classList.add('highlighted');
          }, 100);
          break;
        }
      }
    }
    
    if (highlightAbility) {
      currentTab = 'abilities';
      updateTabVisibility();
      render();
      const cards = abilitiesContainer.querySelectorAll('.pokemon-card');
      for (const card of cards) {
        if (card.querySelector('h2').textContent === highlightAbility) {
          setTimeout(() => {
            card.scrollIntoView({ behavior: 'smooth' });
            card.classList.add('highlighted');
          }, 100);
          break;
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
}

function render() {
  if (currentTab === 'abilities') {
    renderAbilities();
    abilitiesContainer.style.display = 'block';
    movesContainer.style.display = 'none';
    document.querySelector('#viewer-container h2:nth-of-type(1)').style.display = 'block';
    document.querySelector('#viewer-container h2:nth-of-type(2)').style.display = 'none';
  } else {
    renderMoves();
    abilitiesContainer.style.display = 'none';
    movesContainer.style.display = 'block';
    document.querySelector('#viewer-container h2:nth-of-type(1)').style.display = 'none';
    document.querySelector('#viewer-container h2:nth-of-type(2)').style.display = 'block';
  }
}

function updateTabVisibility() {
  const abilityH3 = document.querySelector('#search-container h3:nth-of-type(1)');
  const abilityInput = document.getElementById('ability-search');
  const moveH3 = document.querySelector('#search-container h3:nth-of-type(2)');
  const moveInput = document.getElementById('move-search');
  const filterH3 = document.querySelector('#search-container h3:nth-of-type(3)');
  const typeInput = document.getElementById('type-filter');
  const powerInput = document.getElementById('power-filter');
  const accuracyInput = document.getElementById('accuracy-filter');
  const flagInput = document.getElementById('flag-filter');

  if (currentTab === 'abilities') {
    abilityH3.style.display = 'block';
    abilityInput.style.display = 'block';
    moveH3.style.display = 'none';
    moveInput.style.display = 'none';
    filterH3.style.display = 'none';
    typeInput.style.display = 'none';
    powerInput.style.display = 'none';
    accuracyInput.style.display = 'none';
    flagInput.style.display = 'none';
  } else {
    abilityH3.style.display = 'none';
    abilityInput.style.display = 'none';
    moveH3.style.display = 'block';
    moveInput.style.display = 'block';
    filterH3.style.display = 'block';
    typeInput.style.display = 'block';
    powerInput.style.display = 'block';
    accuracyInput.style.display = 'block';
    flagInput.style.display = 'block';
  }
}

function renderAbilities() {
  const search = document.getElementById('ability-search').value.toLowerCase();

  abilitiesContainer.innerHTML = '';

  abilitiesList
    .filter(a => !search || a.Name.toLowerCase().includes(search))
    .forEach(a => {
      const card = document.createElement('div');
      card.className = 'pokemon-card';
      card.style.backgroundColor = `rgba(${hexToRgb(getTypeColor('normal'))}, 0.3)`;

      const pokemonList = getPokemonForAbility(a.Name);
      const pokemonIcons = pokemonList.map(p => 
        `<img src="./games/${window.game}/images/Front/${p.InternalName}.png" alt="${p.Name}" title="${p.Name}" class="pokemon-icon" data-internal-name="${p.InternalName}" onerror="this.src='./games/${window.game}/images/Front/000.png'">`
      ).join('');

      card.innerHTML = `
        <div class="main-info">
          <h2>${a.Name}</h2>
        </div>
        <ul class="pokemon-stats">
          <li><span class="stat-name">Effect:</span> ${a.Description}</li>
          ${a.FullDesc ? `<li>${a.FullDesc}</li>` : ''}
        </ul>
        <div class="pokemon-list" style="display: none;">
          <h3>Pokémon with this Ability:</h3>
          <div class="pokemon-icons">${pokemonIcons}</div>
        </div>
      `;

      card.querySelectorAll('.pokemon-icon').forEach(img => {
        img.addEventListener('click', (event) => {
          event.stopPropagation();
          const internalName = img.getAttribute('data-internal-name');
          const url = `details.html?pokemon=${encodeURIComponent(internalName)}&game=${window.game}`;
          if (event.button === 0) {
            window.location.href = url;
          } else if (event.button === 1) {
            window.open(url, '_blank');
            event.preventDefault();
          }
        });
      });

      card.addEventListener('click', () => {
        const list = card.querySelector('.pokemon-list');
        list.style.display = list.style.display === 'none' ? 'block' : 'none';
      });

      abilitiesContainer.appendChild(card);
    });
}

function renderMoves() {
  const search = document.getElementById('move-search').value.toLowerCase();
  const type = document.getElementById('type-filter').value.toUpperCase();
  const power = parseInt(document.getElementById('power-filter').value) || 0;
  const acc = parseInt(document.getElementById('accuracy-filter').value) || 0;
  const flagFilter = document.getElementById('flag-filter').value.toLowerCase();

  movesContainer.innerHTML = '';

  movesList
    .filter(m =>
        (!search || m.Name.toLowerCase().includes(search)) &&
        (!type || m.Type === type) &&
        ((m.Power || 0) >= power) &&
        ((m.Accuracy || 0) >= acc) &&
        (!flagFilter || (m.Flags || []).some(f => f.toLowerCase().includes(flagFilter)))
    )
    .forEach(m => {
        const card = document.createElement('div');
        card.className = 'pokemon-card';
        card.style.backgroundColor = `rgba(${hexToRgb(getTypeColor(m.Type))}, 0.3)`;

        // Type icon
        const typeIcon = `<img src="./games/${window.game}/images/Types/${m.Type.toUpperCase()}.png" alt="${m.Type}" title="${m.Type}" class="move-type-icon">`;

        // Category icon (assumes category images are in the folder: PHYSICAL.png, SPECIAL.png, STATUS.png)
        const categoryIcon = `<img src="./games/${window.game}/images/Moves/${m.Category.toUpperCase()}.png" alt="${m.Category}" title="${m.Category}" class="move-category-icon">`;

        // Flags icons (all caps, one icon per flag)
        const flagsIcons = (m.Flags || []).map(f => 
            `<img src="./games/${window.game}/images/Moves/${f.toUpperCase()}.png" alt="${f}" title="${f}" class="move-flag-icon">`
        ).join(' ');

        const flagsList = (m.Flags || []).length > 0 ? `<div class="move-flags">Flags: ${m.Flags.join(', ')}</div>` : '';

        card.innerHTML = `
        <div class="main-info">
            <h2>
                ${m.Name} ${typeIcon} ${categoryIcon} ${flagsIcons}
            </h2>
        </div>
        <ul class="pokemon-stats">
            <li><span class="stat-name">Power:</span> ${m.Power ?? '-'}</li>
            <li><span class="stat-name">Accuracy:</span> ${m.Accuracy ?? '-'}</li>
            <li><span class="stat-name">PP:</span> ${m.TotalPP}</li>
            ${(m.EffectChance && m.EffectChance > 0) ? `<li><span class="stat-name">Effect Chance:</span> ${m.EffectChance}%</li>` : ''}
            <li>${m.Description}</li>
            ${flagsList}
        </ul>
        `;

        const pokemonList = getPokemonForMove(m.Name);
        const pokemonIcons = pokemonList.map(p => 
          `<img src="./games/${window.game}/images/Front/${p.InternalName}.png" alt="${p.Name}" title="${p.Name}" class="pokemon-icon" data-internal-name="${p.InternalName}" onerror="this.src='./games/${window.game}/images/Front/000.png'">`
        ).join('');

        const pokemonDiv = document.createElement('div');
        pokemonDiv.className = 'pokemon-list';
        pokemonDiv.style.display = 'none';
        pokemonDiv.innerHTML = `
          <h3>Pokémon that learn this Move:</h3>
          <div class="pokemon-icons">${pokemonIcons}</div>
        `;

        pokemonDiv.querySelectorAll('.pokemon-icon').forEach(img => {
          img.addEventListener('click', (event) => {
            event.stopPropagation();
            const internalName = img.getAttribute('data-internal-name');
            const url = `details.html?pokemon=${encodeURIComponent(internalName)}&game=${window.game}`;
            if (event.button === 0) {
              window.location.href = url;
            } else if (event.button === 1) {
              window.open(url, '_blank');
              event.preventDefault();
            }
          });
        });

        card.appendChild(pokemonDiv);

        card.addEventListener('click', () => {
          const list = card.querySelector('.pokemon-list');
          list.style.display = list.style.display === 'none' ? 'block' : 'none';
        });

        movesContainer.appendChild(card);
    });
}

// EVENTS
document.querySelectorAll('#search-container input').forEach(el => {
  el.addEventListener('input', render);
});

document.querySelectorAll('#tab-container .tab-button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('#tab-container .tab-button').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    currentTab = button.dataset.tab;
    updateTabVisibility();
    render();
  });
});

document.getElementById('reset-button').addEventListener('click', () => {
  if (currentTab === 'abilities') {
    document.getElementById('ability-search').value = '';
  } else {
    document.getElementById('move-search').value = '';
    document.getElementById('type-filter').value = '';
    document.getElementById('power-filter').value = '';
    document.getElementById('accuracy-filter').value = '';
    document.getElementById('flag-filter').value = '';
  }
  render();
});