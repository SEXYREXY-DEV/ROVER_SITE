// details.js

import { normalizePokemon, getInheritedEggMoves } from './utils.js';

const params = new URLSearchParams(window.location.search);
const game = params.get('game');
const pokemonInternalName = params.get('pokemon');

const pokemonDataPath = `./games/${game}/data/pokemon_master_evo.json`;
const moveDataPath = `./games/${game}/data/moves.json`;

let allPokemon = [];
let allMoves = [];
let allTypes = [];

let config = { excludedPokemon: [], AllowsForms: "Y" };
let currentFormIndex = 0;
let currentRawPokemon = null;
let currentSpriteType = 'Front';

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

    // Propagate egg moves from earlier evolution stages to later stages
    allPokemon = allPokemon.map(pokemon => {
      const inheritedMoves = getInheritedEggMoves(pokemon, allPokemon);
      const ownEggMoves = Array.isArray(pokemon.EggMoves)
        ? pokemon.EggMoves.map(m => m.trim()).filter(Boolean)
        : typeof pokemon.EggMoves === 'string'
          ? pokemon.EggMoves.split(',').map(m => m.trim()).filter(Boolean)
          : [];
      return {
        ...pokemon,
        EggMoves: [...new Set([...ownEggMoves, ...inheritedMoves])]
      };
    });

    if (!pokemonInternalName) {
      document.getElementById('main-container').innerHTML = '<p>No Pokémon specified.</p>';
      return;
    }

    const rawPokemon = allPokemon.find(p => p.InternalName && p.InternalName.toUpperCase() === pokemonInternalName.toUpperCase());
    if (!rawPokemon) {
      document.getElementById('main-container').innerHTML = '<p>Pokémon not found.</p>';
      return;
    }

    currentRawPokemon = rawPokemon;
    currentFormIndex = 0;

    renderFormSelector(rawPokemon);
    renderPokemonDetails(rawPokemon, currentFormIndex);
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

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
}

function renderPokemonDetails(original, selectedFormIndex = 0) {
  const effectivePokemon = getFormData(original, selectedFormIndex > 0 ? original.Forms[selectedFormIndex - 1] : null);
  currentFormIndex = selectedFormIndex;
  currentSpriteType = document.getElementById('sprite-viewer')?.value || currentSpriteType;

  renderMainInfo(effectivePokemon, selectedFormIndex);
  renderEvolutions(original, allPokemon);
  renderFullInfo(effectivePokemon);
  renderForms(original);
  renderMovesTabs(effectivePokemon);
}

function getFormData(basePokemon, form = null) {
  if (!form) {
    return { ...basePokemon };
  }

  const mergeField = (formValue, baseValue) => {
    if (formValue === undefined || formValue === null) return baseValue;
    if (typeof formValue === 'string' && !formValue.trim()) return baseValue;
    if (Array.isArray(formValue) && formValue.length === 0) return baseValue;
    return formValue;
  };

  const result = { ...basePokemon };
  result.InternalName = basePokemon.InternalName;
  result.Name = basePokemon.Name;
  result.Type1 = mergeField(form.Type1, basePokemon.Type1);
  result.Type2 = mergeField(form.Type2, basePokemon.Type2);
  if (Array.isArray(form.types) && form.types.length) {
    result.Types = [...form.types];
    if (!result.Type1 && result.Types[0]) result.Type1 = result.Types[0];
    if (!result.Type2 && result.Types[1]) result.Type2 = result.Types[1];
  } else {
    result.Types = [];
    if (result.Type1) result.Types.push(result.Type1);
    if (result.Type2 && result.Type2 !== result.Type1) result.Types.push(result.Type2);
  }

  result.Abilities = mergeField(form.Abilities, basePokemon.Abilities);
  result.HiddenAbilities = mergeField(form.HiddenAbilities, basePokemon.HiddenAbilities);
  result.HiddenAbility = mergeField(form.HiddenAbility, basePokemon.HiddenAbility);
  result.Moves = mergeField(form.Moves, basePokemon.Moves);
  result.TutorMoves = mergeField(form.TutorMoves, basePokemon.TutorMoves);
  result.EggMoves = mergeField(form.EggMoves, basePokemon.EggMoves);
  result.BaseStats = mergeField(form.BaseStats, basePokemon.BaseStats);
  result.Height = mergeField(form.Height, basePokemon.Height);
  result.Weight = mergeField(form.Weight, basePokemon.Weight);
  result.Rareness = mergeField(form.Rareness, basePokemon.Rareness);
  result.CatchRate = mergeField(form.CatchRate, basePokemon.CatchRate);
  result.Happiness = mergeField(form.Happiness, basePokemon.Happiness);
  result.BaseFriendship = mergeField(form.BaseFriendship, basePokemon.BaseFriendship);
  result.BaseEXP = mergeField(form.BaseEXP, basePokemon.BaseEXP);
  result.GrowthRate = mergeField(form.GrowthRate, basePokemon.GrowthRate);
  result.Kind = mergeField(form.Kind, basePokemon.Kind);
  result.Species = mergeField(form.Species, basePokemon.Species);
  result.Pokedex = mergeField(form.Pokedex, basePokemon.Pokedex);
  result.Compatibility = mergeField(form.Compatibility, basePokemon.Compatibility);
  result.GenderRate = mergeField(form.GenderRate, basePokemon.GenderRate);
  result.GenderRatio = mergeField(form.GenderRatio, basePokemon.GenderRatio);
  result.Forms = basePokemon.Forms;

  const formName = form.FormName || form.name || '';
  if (formName.trim()) {
    result.Name = `${basePokemon.Name} (${formName.trim()})`;
  }

  // Normalize move fields so downstream renderers can assume arrays
  if (typeof result.Moves === 'string') {
    result.Moves = result.Moves.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (typeof result.TutorMoves === 'string') {
    result.TutorMoves = result.TutorMoves.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (typeof result.EggMoves === 'string') {
    result.EggMoves = result.EggMoves.split(',').map(s => s.trim()).filter(Boolean);
  }

  return result;
}

function renderFormSelector(original) {
  const selector = document.getElementById('form-selector');
  if (!selector) return;

  selector.innerHTML = '';
  const baseOption = document.createElement('option');
  baseOption.value = '0';
  baseOption.textContent = 'Base Form';
  selector.appendChild(baseOption);

  if (Array.isArray(original.Forms)) {
    original.Forms.forEach((form, idx) => {
      const option = document.createElement('option');
      option.value = String(idx + 1);
      option.textContent = form.FormName || form.name || `Form ${idx + 1}`;
      selector.appendChild(option);
    });
  }

  selector.value = String(currentFormIndex || 0);
  selector.addEventListener('change', () => {
    const selectedIndex = Number(selector.value);
    currentFormIndex = selectedIndex;
    renderPokemonDetails(original, selectedIndex);
  });
}

function parseAbilityField(field) {
  if (Array.isArray(field)) {
    return field.map(item => String(item).trim()).filter(Boolean);
  }
  if (typeof field !== 'string' || !field.trim()) {
    return [];
  }

  const values = field.split(',').map(item => item.trim()).filter(Boolean);
  const looksLikeMoveSequence = values.length >= 4 && /^\ *\d+$/.test(values[0]) && /^\d+$/.test(values[2]);
  if (looksLikeMoveSequence) {
    return [];
  }

  return values;
}

function setSpriteImage(img, spriteType, baseInternalName, formIndex) {
  const suffix = formIndex > 0 ? `_${formIndex}` : '';
  const candidate = `./games/${game}/images/${spriteType}/${baseInternalName}${suffix}.png`;

  img.src = candidate;
  img.onerror = function () {
    this.onerror = null;
    const fallback = `./games/${game}/images/${spriteType}/${baseInternalName}.png`;
    if (suffix) {
      this.src = fallback;
      this.onerror = function () {
        this.onerror = null;
        this.src = `./games/${game}/images/${spriteType}/000.png`;
      };
    } else {
      this.src = `./games/${game}/images/${spriteType}/000.png`;
    }
  };
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

function renderMainInfo(pokemon, selectedFormIndex = 0) {
  const mainInfo = document.getElementById('main-info');
  mainInfo.innerHTML = '';
  console.log('Pokemon Types:', pokemon.Types);
  console.log('All Types:', allTypes.map(t => t.Name));

  const img = document.createElement('img');
  img.id = 'main-sprite';
  img.className = 'pokemon-image';
  setSpriteImage(img, currentSpriteType, pokemon.InternalName.replace(/T$/, ''), selectedFormIndex);

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
  const abilities = parseAbilityField(pokemon.Abilities);

  let hiddenAbilities = parseAbilityField(pokemon.HiddenAbilities);
  if (!hiddenAbilities.length) {
    hiddenAbilities = parseAbilityField(pokemon.HiddenAbility);
  }

  let html = `<div class="abilities-title">Abilities:</div>`;
  html += `<ul class="abilities-list">`;
  abilities.forEach(a => {
    const ab = allAbilities.find(x =>
      x.Name && normalizeAbilityName(x.Name) === normalizeAbilityName(a)
    );
    const abilityName = ab ? ab.Name : a;
    const abilityUrl = `ability_move_viewer.html?game=${game}&ability=${encodeURIComponent(abilityName)}`;
    html += `<li class="ability"><span class="ability-name">${abilityName}</span><button type="button" class="ability-redirect-button" data-url="${abilityUrl}" title="View ability details">↗</button>${ab && ab.Description ? `: <span class="ability-desc">${ab.Description}</span>` : ''}</li>`;
  });
  html += `</ul>`;

  if (hiddenAbilities.length) {
    html += `<div class="abilities-title">Hidden Ability:</div>`;
    html += `<ul class="abilities-list">`;
    hiddenAbilities.forEach(a => {
      const ab = allAbilities.find(x =>
        x.Name && normalizeAbilityName(x.Name) === normalizeAbilityName(a)
      );
      const abilityName = ab ? ab.Name : a;
      const abilityUrl = `ability_move_viewer.html?game=${game}&ability=${encodeURIComponent(abilityName)}`;
      html += `<li class="ability"><span class="ability-name">${abilityName}</span><button type="button" class="ability-redirect-button" data-url="${abilityUrl}" title="View ability details">↗</button>: <span class="ability-desc">${ab ? ab.Description : 'No description.'}</span></li>`;
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

  document.querySelectorAll('.ability-redirect-button').forEach(button => {
    button.addEventListener('click', () => {
      window.location.href = button.dataset.url;
    });
  });

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
    const abilities = parseAbilityField(form.Abilities);
    let hiddenAbilities = parseAbilityField(form.HiddenAbilities);
    if (!hiddenAbilities.length) {
      hiddenAbilities = parseAbilityField(form.HiddenAbility);
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
    const evoA = document.createElement('a');
    evoA.className = 'evo-stage';
    evoA.dataset.internalName = p.InternalName;
    if (highlight) evoA.classList.add('current-pokemon');
    evoA.href = `details.html?pokemon=${encodeURIComponent(p.InternalName)}&game=${game}`;
    evoA.innerHTML = `
      <img src="./games/${game}/images/Front/${p.InternalName.toUpperCase()}.png" alt="${p.Name}" class="evolution-sprite" />
      <div>${p.Name}</div>
    `;

    return evoA;
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
  container.querySelectorAll('.evo-stage').forEach(a => {
    if (a.textContent.includes(original.Name)) {
      a.classList.add('current_pokemon');
    }
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

function buildMoveLookup(movesData) {
  const lookup = new Map();
  movesData.forEach(move => {
    if (typeof move.Name === 'string' && move.Name.trim()) {
      lookup.set(move.Name.trim().toUpperCase(), move);
    }
    if (typeof move.InternalName === 'string' && move.InternalName.trim()) {
      lookup.set(move.InternalName.trim().toUpperCase(), move);
    }
  });
  return lookup;
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
    } else if (typeof pokemon.TutorMoves === 'string') {
      moves = pokemon.TutorMoves.split(',').map(name => ({ name: name.trim() })).filter(m => m.name);
    }
  } else if (tab === 'egg') {
    if (typeof pokemon.EggMoves === 'string') {
      moves = pokemon.EggMoves.split(',').map(name => ({ name: name.trim() })).filter(m => m.name);
    } else if (Array.isArray(pokemon.EggMoves)) {
      moves = pokemon.EggMoves.map(name => ({ name: name.trim() })).filter(m => m.name);
    }
  }

  const moveLookup = buildMoveLookup(movesData);
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
            <th>Flags</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody id="moves-table-body-${tab}"></tbody>
      </table>
    </div>
  `;

  const tbody = document.getElementById(`moves-table-body-${tab}`);
  moves.forEach(m => {
    const normalizedName = typeof m.name === 'string' ? m.name.trim().toUpperCase() : '';
    const move = moveLookup.get(normalizedName) || {};
    const displayName = move.Name || m.name;

    const typeImage = move.Type
      ? `<img src="./games/${game}/images/Types/${move.Type.toUpperCase()}.png" alt="${move.Type} Type" class="type-icon" style="width:50px;height:50px;">`
      : 'N/A';

  const categoryImage = move.Category
    ? `<img src="./games/${game}/images/Moves/${move.Category.toUpperCase()}.png" alt="${move.Category} Category" class="category-icon" style="width:60px;height:32px;">`
    : 'N/A';

  const row = document.createElement("tr");

  // --- COLOR SETUP ---
  const baseColor = hexToRgb(getTypeColor(move.Type || 'UNKNOWN')) || '200, 200, 200';
  const normalColor = `rgba(${baseColor}, 0.3)`;
  const hoverColor = `rgba(${baseColor}, 0.6)`;

  row.style.backgroundColor = normalColor;
  row.style.cursor = 'pointer';
  row.style.transition = 'background-color 0.2s ease';

  // --- HOVER LOGIC ---
  row.addEventListener('mouseenter', () => {
    row.style.backgroundColor = hoverColor;
  });

  row.addEventListener('mouseleave', () => {
    row.style.backgroundColor = normalColor;
  });

  // --- CLICK LOGIC (FIXED) ---
  row.addEventListener('mousedown', (event) => {
    const url = `ability_move_viewer.html?game=${game}&move=${encodeURIComponent(displayName)}`;

    if (event.button === 0) {
      window.location.href = url;
    } else if (event.button === 1) {
      window.open(url, '_blank');
      event.preventDefault();
    }
  });

  row.innerHTML = `
    <td>${displayName}</td>
    ${tab === 'levelup' ? `<td>${m.level}</td>` : ''}
    <td>${typeImage}</td>
    <td>${categoryImage}</td>
    <td>${move.Power || '-'}</td>
    <td>${move.Accuracy || '-'}</td>
    <td>${(move.Flags || []).join(', ')}</td>
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
  let hiddenAbilities = parseAbilityField(pokemon.HiddenAbilities);
  if (!hiddenAbilities.length) {
    hiddenAbilities = parseAbilityField(pokemon.HiddenAbility);
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

  let items = [
  pokemon.WildItemCommon,
  pokemon.WildItemUncommon,
  pokemon.WildItemRare
  ].filter(Boolean);

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
      ${items.length ? `<li><strong>WildHeldItems:</strong> ${items.join(', ')}</li>` : ''}
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
    currentSpriteType = selector.value;
    const img = document.getElementById('main-sprite');
    if (img && currentRawPokemon) {
      setSpriteImage(img, currentSpriteType, currentRawPokemon.InternalName.replace(/T$/, ''), currentFormIndex);
    }
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
    // normalize for safety
    const typeObj = allTypes.find(t => t.Name === type);
    if (!typeObj) return;

    // 2×
    (typeObj.Weaknesses || []).forEach(t => {
      if (effectiveness[t] !== 0) {
        effectiveness[t] = (effectiveness[t] || 1) * 2;
      }
    });

    // 0.5×
    (typeObj.Resistances || []).forEach(t => {
      if (effectiveness[t] !== 0) {
        effectiveness[t] = (effectiveness[t] || 1) * 0.5;
      }
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
