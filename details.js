// details.js

import { normalizePokemon } from './utils.js';

const params = new URLSearchParams(window.location.search);
const game = params.get('game');
const pokemonInternalName = localStorage.getItem('selectedPokemon');

const pokemonDataPath = `./games/${game}/data/pokemon_master_evo.json`;
const moveDataPath = `./games/${game}/data/moves.json`;

let allPokemon = [];
let allMoves = [];
let allTypes = [];

let config = { excludedPokemon: [], AllowsForms: "Y" };

window.addEventListener('DOMContentLoaded', async () => {
  try {
    // --- Load config.json ---
    try {
      const configResp = await fetch(`./games/${game}/data/config.json`);
      if (configResp.ok) {
        config = await configResp.json();
      }
    } catch (e) {
      config = { excludedPokemon: [], AllowsForms: "Y" };
    }

    [allPokemon, allMoves, allAbilities, allTypes] = await Promise.all([
      fetch(pokemonDataPath).then(res => res.json()),
      fetch(moveDataPath).then(res => res.json()),
      fetch(`./games/${game}/data/abilities.json`).then(res => res.json()),
      fetch(`./games/${game}/data/types.json`).then(res => res.json())
    ]);

    // Exclude Pokémon in config.excludedPokemon
    allPokemon = allPokemon.filter(
      p => !config.excludedPokemon.includes(p.InternalName)
    );

    // Remove forms if not allowed
    if (config.AllowsForms === "N") {
      allPokemon.forEach(p => { p.Forms = []; });
    }

    const rawPokemon = allPokemon.find(p => p.InternalName.toUpperCase() === pokemonInternalName.toUpperCase());
    const normalizedPokemon = normalizePokemon(rawPokemon);

    renderPokemonDetails(normalizedPokemon);
    setupSpriteSelector();
    setupTabs();

    // Show only the first tab by default
    document.querySelectorAll('.tab-content').forEach((tab, idx) => {
      tab.classList.toggle('hidden', idx !== 0);
    });
    document.querySelectorAll('.tab-button').forEach((btn, idx) => {
      btn.classList.toggle('active', idx === 0);
    });
  } catch (err) {
    document.getElementById('main-container').innerHTML = '<p>Error loading Pokémon data.</p>';
    console.error(err);
  }
});

let allAbilities = [];

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

function renderPokemonDetails(pokemon) {
  const original = allPokemon.find(p => p.InternalName.toLowerCase() === pokemon.InternalName);
  const normalized = normalizePokemon(original);

  renderMainInfo(original, normalized);
  renderEvolutions(original, allPokemon);
  renderFullInfo(original);
  renderForms(original);
  renderMovesTabs(original);
}

function createStatsContainer(stats) {
  const container = document.createElement('div');
  container.className = 'stat-container';

  const statList = document.createElement('ul');
  statList.className = 'stat-list';

  let bst = 0;
  Object.entries(stats).forEach(([stat, value]) => {
    let cleanValue = typeof value === 'string' ? value.split('#')[0].trim() : value;
    bst += Number(cleanValue) || 0;
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="stat-name">${stat}</span>
      <span class="stat-bar-value">${cleanValue}</span>
    `;
    statList.appendChild(li);
  });

  // Add BST row
  const bstLi = document.createElement('li');
  bstLi.innerHTML = `
    <span class="stat-name"><strong>BST</strong></span>
    <span class="stat-bar-value"><strong>${bst}</strong></span>
  `;
  statList.appendChild(bstLi);

  container.appendChild(statList);
  return container;
}

function renderMainInfo(pokemon) {
  const mainInfo = document.getElementById('main-info');
  mainInfo.innerHTML = '';
  console.log('Pokemon Types:', pokemon.Types);
  console.log('All Types:', allTypes.map(t => t.Name));

  const img = document.createElement('img');
  img.id = 'main-sprite';
  img.className = 'pokemon-image';
  img.src = `./games/${game}/images/Front/${pokemon.InternalName}.png`;
  img.onerror = function () {
    this.onerror = null;
    this.src = `./games/${game}/images/Front/${pokemon.InternalName}T.png`;
  };

  const nameEl = document.createElement('h2');
  nameEl.id = 'pokemon-name';
  nameEl.textContent = pokemon.Name;

  const typesContainer = document.createElement('div');
  typesContainer.id = 'type-container';
  if (Array.isArray(pokemon.Types)) {
    pokemon.Types.forEach(type => {
      const typeImg = document.createElement('img');
      typeImg.src = `./games/${game}/images/Types/${type}.png`;
      typeImg.alt = type;
      typeImg.className = 'type-icon';
      typesContainer.appendChild(typeImg);
    });
  }

  function normalizeAbilityName(name) {
    return name ? name.replace(/\s+/g, '').toLowerCase() : '';
  }

  const abilitiesEl = document.createElement('div');
  abilitiesEl.id = 'abilities';
  const abilities = Array.isArray(pokemon.Abilities)
    ? pokemon.Abilities
    : (typeof pokemon.Abilities === 'string' ? pokemon.Abilities.split(',').map(a => a.trim()).filter(Boolean) : []);

  let hiddenAbilities = [];
  if (pokemon.HiddenAbilities) {
    hiddenAbilities = Array.isArray(pokemon.HiddenAbilities)
      ? pokemon.HiddenAbilities
      : (typeof pokemon.HiddenAbilities === 'string' ? pokemon.HiddenAbilities.split(',').map(a => a.trim()).filter(Boolean) : []);
  } else if (pokemon.HiddenAbility) {
    hiddenAbilities = Array.isArray(pokemon.HiddenAbility)
      ? pokemon.HiddenAbility
      : (typeof pokemon.HiddenAbility === 'string' ? pokemon.HiddenAbility.split(',').map(a => a.trim()).filter(Boolean) : []);
  }

  let html = `<div class="abilities-title">Abilities:</div>`;
  html += `<ul class="abilities-list">`;
  abilities.forEach(a => {
    const ab = allAbilities.find(x =>
      x.Name && normalizeAbilityName(x.Name) === normalizeAbilityName(a)
    );
    html += `<li class="ability"><span class="ability-name">${ab ? ab.Name : a}</span>${ab && ab.Description ? `: <span class="ability-desc">${ab.Description}</span>` : ''}</li>`;
  });
  html += `</ul>`;

  if (hiddenAbilities.length) {
    html += `<div class="abilities-title">Hidden Ability:</div>`;
    html += `<ul class="abilities-list">`;
    hiddenAbilities.forEach(a => {
      const ab = allAbilities.find(x =>
        x.Name && normalizeAbilityName(x.Name) === normalizeAbilityName(a)
      );
      html += `<li class="ability"><span class="ability-name">${ab ? ab.Name : a}</span>: <span class="ability-desc">${ab ? ab.Description : 'No description.'}</span></li>`;
    });
    html += `</ul>`;
  }
  abilitiesEl.innerHTML = html;

  mainInfo.appendChild(img);
  mainInfo.appendChild(nameEl);
  mainInfo.appendChild(typesContainer);

  const abilitiesContainer = document.getElementById('abilities-container');
  if (abilitiesContainer) {
    abilitiesContainer.innerHTML = html;
  }

  let types = [];
  if (Array.isArray(pokemon.Types) && pokemon.Types.length) {
    types = pokemon.Types;
  } else {
    if (pokemon.Type1) types.push(pokemon.Type1);
    if (pokemon.Type2 && pokemon.Type2 !== pokemon.Type1) types.push(pokemon.Type2);
  }

  const effectivenessContainer = document.getElementById('type-effectiveness-container');
  if (effectivenessContainer) {
    let types = [];
    if (Array.isArray(pokemon.Types) && pokemon.Types.length) {
      types = pokemon.Types;
    } else {
      if (pokemon.Type1) types.push(pokemon.Type1);
      if (pokemon.Type2 && pokemon.Type2 !== pokemon.Type1) types.push(pokemon.Type2);
    }

    const effectiveness = getTypeEffectiveness(types);

    effectivenessContainer.innerHTML = `
      <div class="type-effectiveness-card">
        <div class="type-effectiveness-row">
          <span class="type-effectiveness-label hypereffective">Hyperffective</span>
          <span class="type-effectiveness-icons">
             ${effectiveness.hypereffective.map(type =>
              `<img src="./games/${game}/images/Types/${type}.png" class="type-icon" title="${type}" alt="${type}">`
            ).join(' ')}
          </span>
        </div>
        <div class="type-effectiveness-row">
          <span class="type-effectiveness-label weak">Supereffective</span>
          <span class="type-effectiveness-icons">
            ${effectiveness.weaknesses.map(type =>
              `<img src="./games/${game}/images/Types/${type}.png" class="type-icon" title="${type}" alt="${type}">`
            ).join(' ')}
          </span>
        </div>
        <div class="type-effectiveness-row">
          <span class="type-effectiveness-label resist">Not Very Effective</span>
          <span class="type-effectiveness-icons">
            ${effectiveness.resistances.map(type =>
              `<img src="./games/${game}/images/Types/${type}.png" class="type-icon" title="${type}" alt="${type}">`
            ).join(' ')}
          </span>
        </div>
        <div class="type-effectiveness-row">
          <span class="type-effectiveness-label barelyeffective">Barely Effective</span>
          <span class="type-effectiveness-icons">
            ${effectiveness.barelyeffective.map(type =>
              `<img src="./games/${game}/images/Types/${type}.png" class="type-icon" title="${type}" alt="${type}">`
            ).join(' ')}
          </span>
        </div>
        <div class="type-effectiveness-row">
          <span class="type-effectiveness-label immune">Immune</span>
          <span class="type-effectiveness-icons">
            ${effectiveness.immunities.map(type =>
              `<img src="./games/${game}/images/Types/${type}.png" class="type-icon" title="${type}" alt="${type}">`
            ).join(' ')}
          </span>
        </div>
      </div>
    `;
  }
}

function renderForms(pokemon) {
  const formsContainer = document.getElementById('forms-container');
  if (!formsContainer) return;

  // Only render if Forms is a non-empty array
  if (!Array.isArray(pokemon.Forms) || pokemon.Forms.length === 0) {
    formsContainer.innerHTML = '<p>No alternate forms.</p>';
    return;
  }

  formsContainer.innerHTML = '';

  // Define baseInternalName for use in createFormImage
  const baseInternalName = pokemon.InternalName.replace(/T$/, '');

  pokemon.Forms.forEach((form, idx) => {
    const formCard = document.createElement('div');
    formCard.className = 'form-card';

    // Form image
    const formImage = createFormImage(baseInternalName, idx + 1, pokemon.Forms.length, game);
    formCard.appendChild(formImage);

    // Form name/title
    const formTitle = document.createElement('h3');
    formTitle.textContent = form.FormName || form.name || `Form ${idx + 1}`;
    formCard.appendChild(formTitle);

    // Types
    const formTypes = document.createElement('div');
    let types = [];
    if (form.Type1) types.push(form.Type1);
    if (form.Type2 && form.Type2 !== form.Type1) types.push(form.Type2);
    if (form.types && Array.isArray(form.types)) types = form.types;
    types.forEach(type => {
      const typeImg = document.createElement('img');
      typeImg.src = `./games/${game}/images/Types/${type}.png`;
      typeImg.alt = type;
      typeImg.className = 'type-icon';
      formTypes.appendChild(typeImg);
      const typeLabel = document.createElement('span');
      typeLabel.textContent = ` ${type} `;
      formTypes.appendChild(typeLabel);
    });
    if (types.length) formCard.appendChild(formTypes);

    // Abilities
    let abilities = [];
    if (form.Abilities) {
      if (Array.isArray(form.Abilities)) {
        abilities = form.Abilities;
      } else if (typeof form.Abilities === 'string') {
        abilities = form.Abilities.split(',').map(a => a.trim()).filter(Boolean);
      }
    }
    let hiddenAbilities = [];
    if (form.HiddenAbility) {
      if (Array.isArray(form.HiddenAbility)) {
        hiddenAbilities = form.HiddenAbility;
      } else if (typeof form.HiddenAbility === 'string') {
        hiddenAbilities = form.HiddenAbility.split(',').map(a => a.trim()).filter(Boolean);
      }
    }
    const formAbilities = document.createElement('div');
    formAbilities.innerHTML = `<strong>Abilities:</strong> ${abilities.join(', ') || 'None'}`
      + (hiddenAbilities.length ? `<br><strong>Hidden Ability:</strong> ${hiddenAbilities.join(', ')}` : '');
    formCard.appendChild(formAbilities);

    // Stats
    if (form.BaseStats && Array.isArray(form.BaseStats) && form.BaseStats.length === 6) {
      const stats = {
        HP: form.BaseStats[0],
        Attack: form.BaseStats[1],
        Defense: form.BaseStats[2],
        SpAtk: form.BaseStats[4],
        SpDef: form.BaseStats[5],
        Speed: form.BaseStats[3]
      };
      const statsBox = createStatsContainer(stats);
      formCard.appendChild(statsBox);
    }

    formCard.style.borderImage = `linear-gradient(to top, ${getTypeColor(types[1])}, ${getTypeColor(types[0])}) 1`;
    formCard.style.borderStyle = 'solid';
    formCard.style.borderWidth = '3px';

    formsContainer.appendChild(formCard);
  });
}

function renderEvolutions(original, allOriginalPokemon) {
  const container = document.getElementById('evolutions');
  container.innerHTML = '';

  // Evo map
  const forwardMap = new Map();
  for (const p of allOriginalPokemon) {
    let evolutions = [];
    if (Array.isArray(p.Evolutions)) {
      evolutions = p.Evolutions;
    } else if (typeof p.Evolutions === 'string' && p.Evolutions.trim()) {
      // Split string into triplets: [target, param, method]
      const evoArr = p.Evolutions.split(',').map(e => e.trim()).filter(Boolean);
      for (let i = 0; i < evoArr.length; i += 3) {
        evolutions.push([evoArr[i], evoArr[i+1], evoArr[i+2]]);
      }
    }
    for (const evo of evolutions) {
      const [target, param, method] = evo;
      if (!forwardMap.has(p.InternalName)) forwardMap.set(p.InternalName, []);
      forwardMap.get(p.InternalName).push({ target, param, method });
    }
  }

  // Find all pre-evolutions recursively
  function findPreEvo(name) {
    for (const [base, evos] of forwardMap.entries()) {
      if (evos.some(evo => evo.target === name)) {
        return base;
      }
    }
    return null;
  }

  // Get all direct evolutions for a Pokémon
  function getDirectEvolutions(name) {
    return forwardMap.get(name) || [];
  }

  // Find the root/base of the chain for Pokémon
  let root = original.InternalName;
  let prev = findPreEvo(root);
  while (prev) {
    root = prev;
    prev = findPreEvo(root);
  }

  // Render the evolution chain as a split tree
  function renderChain(name, highlight) {
    const p = allOriginalPokemon.find(pkmn => pkmn.InternalName === name);
    const evoDiv = document.createElement('div');
    evoDiv.className = 'evo-stage';
    evoDiv.dataset.internalName = p.InternalName;
    if (highlight) evoDiv.classList.add('current-pokemon');
    evoDiv.innerHTML = `
      <img src="./games/${game}/images/Front/${p.InternalName.toUpperCase()}.png" alt="${p.Name}" class="evolution-sprite" />
      <div>${p.Name}</div>
    `;

    return evoDiv;
  }

  // Recursive: Render branches from a Pokémon
  function renderBranches(name) {
    const evos = getDirectEvolutions(name);
    if (evos.length === 0) return null;

    const branchDiv = document.createElement('div');
    branchDiv.className = 'evo-branches';

    evos.forEach(evo => {
      const targetPoke = allOriginalPokemon.find(pkmn => pkmn.InternalName === evo.target);
      const branch = document.createElement('div');
      branch.className = 'evo-branch';

      // Evo method/item
      const methodDiv = document.createElement('div');
      methodDiv.className = 'evo-method';
      let methodText = evo.method ? evo.method.replace(/_/g, ' ') : 'Method';
      if (evo.param) {
        // NOTE: FUTURE: If it's an item, show the item image if available 
        if (evo.method && evo.method.toLowerCase().includes('item')) {
          methodText += `<br><img src="./games/${game}/images/Items/${evo.param}.png" alt="${evo.param}" class="evo-item-icon" /><br>${evo.param}`;
        } else {
          methodText += ` (${evo.param})`;
        }
      }
      methodDiv.innerHTML = methodText;

      // Target Pokémon
      const pokeDiv = renderChain(evo.target, evo.target === original.InternalName);

      branch.appendChild(methodDiv);
      branch.appendChild(pokeDiv);

      // Recursively render further evolutions
      const further = renderBranches(evo.target);
      if (further) branch.appendChild(further);

      branchDiv.appendChild(branch);
    });

    return branchDiv;
  }

  // Render the root Pokémon
  const rootDiv = document.createElement('div');
  rootDiv.className = 'evo-root';
  rootDiv.appendChild(renderChain(root, root === original.InternalName));

  // Render branches from root
  const branches = renderBranches(root);
  if (branches) rootDiv.appendChild(branches);

  container.appendChild(rootDiv);

  // Highlight the current Pokémon in the chain
  container.querySelectorAll('.evo-stage').forEach(div => {
    if (div.textContent.includes(original.Name)) {
      div.classList.add('current_pokemon');
    }
    div.onclick = () => {
      const internalName = div.dataset.internalName; // <-- Use this instead
      const poke = allOriginalPokemon.find(p => p.InternalName === internalName);
      if (poke) {
        localStorage.setItem('selectedPokemon', poke.InternalName);
        window.location.reload();
      }
    };
  });
}

function renderMovesTabs(pokemon) {
  const moveTabs = document.getElementById('move-tabs');
  if (!moveTabs) return;

  moveTabs.innerHTML = `
    <div class="tab-buttons">
      <button class="tab-button active" data-tab="levelup">Level Up</button>
      <button class="tab-button" data-tab="tutor">Tutor</button>
      <button class="tab-button" data-tab="egg">Egg</button>
    </div>
    <div class="tab-content" id="levelup"></div>
    <div class="tab-content hidden" id="tutor"></div>
    <div class="tab-content hidden" id="egg"></div>
  `;

  // Render tables for each tab
  renderMovesTable(pokemon, allMoves, 'levelup');
  renderMovesTable(pokemon, allMoves, 'tutor');
  renderMovesTable(pokemon, allMoves, 'egg');

  // Tab switching logic
  const buttons = moveTabs.querySelectorAll('.tab-button');
  const tabs = moveTabs.querySelectorAll('.tab-content');
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      buttons.forEach(btn => btn.classList.remove('active'));
      tabs.forEach(tab => tab.classList.add('hidden'));
      button.classList.add('active');
      document.getElementById(button.dataset.tab).classList.remove('hidden');
    });
  });
}

function renderMovesTable(pokemon, movesData, tab) {
  let moves = [];
  if (tab === 'levelup') {
    if (Array.isArray(pokemon.Moves)) {
      for (let i = 0; i < pokemon.Moves.length; i += 2) {
        moves.push({
          level: pokemon.Moves[i],
          name: pokemon.Moves[i + 1]
        });
      }
    }
  } else if (tab === 'tutor') {
    if (Array.isArray(pokemon.TutorMoves)) {
      moves = pokemon.TutorMoves.map(name => ({ name }));
    }
  } else if (tab === 'egg') {
    if (typeof pokemon.EggMoves === 'string') {
      moves = pokemon.EggMoves.split(',').map(name => ({ name: name.trim() })).filter(m => m.name);
    } else if (Array.isArray(pokemon.EggMoves)) {
      moves = pokemon.EggMoves.map(name => ({ name: name.trim() })).filter(m => m.name);
    }
  }

  const container = document.getElementById(tab);
  if (!container) return;

  if (!moves.length) {
    container.innerHTML = `<p>No moves available.</p>`;
    return;
  }

  container.innerHTML = `
    <div class="moves-table-scroll">
      <table class="moves-table">
        <thead>
          <tr>
            <th>Move</th>
            ${tab === 'levelup' ? '<th>Level</th>' : ''}
            <th>Type</th>
            <th>Category</th>
            <th>Power</th>
            <th>Accuracy</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody id="moves-table-body-${tab}"></tbody>
      </table>
    </div>
  `;

  const tbody = document.getElementById(`moves-table-body-${tab}`);
  moves.forEach(m => {
    const move = movesData.find(x => x.InternalName === m.name || x.Name === m.name) || {};
    const typeImage = move.Type
      ? `<img src="./games/${game}/images/Types/${move.Type.toUpperCase()}.png" alt="${move.Type} Type" class="type-icon" style="width:50px;height:50px;">`
      : 'N/A';
    const categoryImage = move.Category
      ? `<img src="./games/${game}/images/Moves/${move.Category.toUpperCase()}.png" alt="${move.Category} Category" class="category-icon" style="width:60px;height:32px;">`
      : 'N/A';
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${move.Name || m.name}</td>
      ${tab === 'levelup' ? `<td>${m.level}</td>` : ''}
      <td>${typeImage}</td>
      <td>${categoryImage}</td>
      <td>${move.Power || '-'}</td>
      <td>${move.Accuracy || '-'}</td>
      <td>${move.Description || 'No description available'}</td>
    `;
    tbody.appendChild(row);
  });
}

function renderFullInfo(pokemon) {
  const info = document.getElementById('full-info');
  if (!info) return;

  // --- Type(s) ---
  let types = [];
  if (pokemon.Type1) types.push(pokemon.Type1);
  if (pokemon.Type2 && pokemon.Type2 !== pokemon.Type1) types.push(pokemon.Type2);

  // --- Abilities ---
  let abilities = [];
  if (pokemon.Abilities) {
    if (Array.isArray(pokemon.Abilities)) {
      abilities = pokemon.Abilities;
    } else if (typeof pokemon.Abilities === 'string') {
      abilities = pokemon.Abilities.split(',').map(a => a.trim()).filter(Boolean);
    }
  }
  let hiddenAbilities = [];
  if (pokemon.HiddenAbility) {
    if (Array.isArray(pokemon.HiddenAbility)) {
      hiddenAbilities = pokemon.HiddenAbility;
    } else if (typeof pokemon.HiddenAbility === 'string') {
      hiddenAbilities = pokemon.HiddenAbility.split(',').map(a => a.trim()).filter(Boolean);
    }
  }
  // --- Egg Groups ---
  let eggGroups = [];
  if (pokemon.Compatibility) {
    if (Array.isArray(pokemon.Compatibility)) {
      eggGroups = pokemon.Compatibility;
    } else if (typeof pokemon.Compatibility === 'string') {
      eggGroups = pokemon.Compatibility.split(',').map(e => e.trim()).filter(Boolean);
    }
  }

  // --- Base Stats ---
  let stats = {};
  if (Array.isArray(pokemon.BaseStats) && pokemon.BaseStats.length === 6) {
    // [HP, Attack, Defense, Sp. Atk, Sp. Def, Speed]
    stats = {
      HP: pokemon.BaseStats[0],
      Attack: pokemon.BaseStats[1],
      Defense: pokemon.BaseStats[2],
      SpAtk: pokemon.BaseStats[4],
      SpDef: pokemon.BaseStats[5],
      Speed: pokemon.BaseStats[3]
    };
  } else if (Array.isArray(pokemon.BaseStats) && pokemon.BaseStats.length === 1) {
    stats = { HP: pokemon.BaseStats[0] };
  } else if (typeof pokemon.BaseStats === 'object') {
    stats = pokemon.BaseStats;
  }

  const statsBox = createStatsContainer(stats);
  const statsContainer = document.getElementById('stats-container');
  if (statsContainer) {
    statsContainer.innerHTML = '';
    statsContainer.appendChild(statsBox);
  } else {
    document.getElementById('full-info').appendChild(statsBox);
  }

  // --- Gender Ratio ---
  let gender = pokemon.GenderRate || pokemon.GenderRatio || 'Unknown';

  // --- Growth Rate ---
  let growth = pokemon.GrowthRate || 'Unknown';

  // --- Height/Weight ---
  let height = pokemon.Height || 'N/A';
  let weight = pokemon.Weight || 'N/A';

  // --- Catch Rate ---
  let catchRate = pokemon.Rareness || pokemon.CatchRate || 'N/A';

  // --- Base Friendship ---
  let friendship = pokemon.Happiness || pokemon.BaseFriendship || 'N/A';

  // --- Base EXP ---
  let baseExp = pokemon.BaseEXP || pokemon.BaseExp || 'N/A';

  // --- Species/Kind ---
  let species = pokemon.Kind || pokemon.Species || '';

  // --- Pokédex Entry ---
  let pokedex = pokemon.Pokedex || '';

  // --- Render ---
  info.innerHTML = `
    <h3>Pokédex Data</h3>
    <ul>
      <li><strong>Type:</strong> ${types.map(type =>
        `<img src="./games/${game}/images/Types/${type}.png" class="type-icon" alt="${type}"> ${type}`
        ).join(' / ')}</li>
      ${species ? `<li><strong>Species:</strong> ${species}</li>` : ''}
      <li><strong>Height:</strong> ${height} m</li>
      <li><strong>Weight:</strong> ${weight} kg</li>
      <li><strong>Base EXP:</strong> ${baseExp}</li>
      <li><strong>Catch Rate:</strong> ${catchRate}</li>
      <li><strong>Base Friendship:</strong> ${friendship}</li>
      <li><strong>Growth Rate:</strong> ${growth}</li>
      ${eggGroups.length ? `<li><strong>Egg Groups:</strong> ${eggGroups.join(', ')}</li>` : ''}
      <li><strong>Gender Ratio:</strong> ${gender}</li>
    </ul>
    <h3>Pokedex Entry</h3>
    <p>${pokedex || 'No Pokédex entry.'}</p>
  `;
}

function createFormImage(baseInternalName, formIndex, maxForms, game) {
  const image = new Image();
  image.className = 'pokemon-image';
  let currentIndex = formIndex;

  const tryNext = () => {
    if (currentIndex <= maxForms + 1) {
      image.src = `./games/${game}/images/Front/${baseInternalName}_${currentIndex}.png`;
      image.onerror = tryNext;
      currentIndex++;
    } else {
      image.onerror = null;
      image.src = `./games/${game}/images/Front/000.png`;
    }
  };

  tryNext();
  return image;
}

function setupSpriteSelector() {
  const selector = document.getElementById('sprite-viewer');
  selector.addEventListener('change', () => {
    const spriteType = selector.value;
    const spritePath = `./games/${game}/images/${spriteType}/${pokemonInternalName}.png`;
    const img = document.getElementById('main-sprite');
    img.src = spritePath;
    img.onerror = () => {
      img.src = `./games/${game}/images/${spriteType}/000.png`;
    };
  });
}

function setupTabs() {
  const buttons = document.querySelectorAll('.tab-button');
  const tabs = document.querySelectorAll('.tab-content');

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      buttons.forEach(btn => btn.classList.remove('active'));
      tabs.forEach(tab => tab.classList.add('hidden'));
      button.classList.add('active');
      document.getElementById(button.dataset.tab).classList.remove('hidden');
    });
  });
}

// updated effectiveness to actually work :3 I forgor about proper ordering on dual types
function getTypeEffectiveness(types) {
  const effectiveness = {};

  types.forEach(type => {
    const typeObj = allTypes.find(t => t.Name === type);
    if (!typeObj) return;

    // 2×
    (typeObj.Weaknesses || []).forEach(t => {
      effectiveness[t] = (effectiveness[t] || 1) * 2;
    });

    // 0.5×
    (typeObj.Resistances || []).forEach(t => {
      effectiveness[t] = (effectiveness[t] || 1) * 0.5;
    });

    // 0×
    (typeObj.Immunities || []).forEach(t => {
      effectiveness[t] = 0;
    });
  });

  const weaknesses = [];
  const resistances = [];
  const immunities = [];
  const hypereffective = [];
  const barelyeffective = [];

  for (const [type, multiplier] of Object.entries(effectiveness)) {
    if (multiplier === 0) {
      immunities.push(type);
    } else if (multiplier === 4) {
      hypereffective.push(type);
    } else if (multiplier === 2) {
      weaknesses.push(type);
    } else if (multiplier === 0.25) {
      barelyeffective.push(type);
    } else if (multiplier === 0.5) {
      resistances.push(type);
    }
  }

  return {
    hypereffective,
    weaknesses,
    resistances,
    barelyeffective,
    immunities
  };
}
