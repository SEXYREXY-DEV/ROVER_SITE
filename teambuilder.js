import { normalizePokemon, findMatchingOriginal } from './utils.js';

const params = new URLSearchParams(window.location.search);
const game = params.get('game') || 'ss2';

const teamKey = `team_${game}`;
let allPokemon = [];
let allMoves = [];
let normalizedList = [];
let currentTeam = [null, null, null, null, null, null];
let editingSlot = null;

// Search selection state
let searchMatches = [];
let searchIndex = -1;
let lastSearchQuery = '';
let editingCandidate = null; // selected pokemon in editor-panel (not yet in team)

function showStatus(msg, timeout = 3000) {
  const s = document.getElementById('status');
  if (!s) return;
  s.textContent = msg;
  if (timeout) setTimeout(() => { if (s.textContent === msg) s.textContent = ''; }, timeout);
}

// Natures map (inc/dec stat keys)
const NATURES = {
  'Hardy': {inc:null, dec:null},
  'Lonely': {inc:'atk', dec:'def'},
  'Brave': {inc:'atk', dec:'spe'},
  'Adamant': {inc:'atk', dec:'spa'},
  'Naughty': {inc:'atk', dec:'spd'},
  'Bold': {inc:'def', dec:'atk'},
  'Relaxed': {inc:'def', dec:'spe'},
  'Impish': {inc:'def', dec:'spa'},
  'Lax': {inc:'def', dec:'spd'},
  'Timid': {inc:'spe', dec:'atk'},
  'Hasty': {inc:'spe', dec:'def'},
  'Jolly': {inc:'spe', dec:'spa'},
  'Naive': {inc:'spe', dec:'spd'},
  'Modest': {inc:'spa', dec:'atk'},
  'Mild': {inc:'spa', dec:'def'},
  'Quiet': {inc:'spa', dec:'spe'},
  'Rash': {inc:'spa', dec:'spd'},
  'Calm': {inc:'spd', dec:'atk'},
  'Gentle': {inc:'spd', dec:'def'},
  'Sassy': {inc:'spd', dec:'spe'},
  'Careful': {inc:'spd', dec:'spa'},
  'Serious': {inc:null, dec:null},
  'Docile': {inc:null, dec:null},
  'Bashful': {inc:null, dec:null},
  'Quirky': {inc:null, dec:null}
};

function natureMultiplier(nature, statKey) {
  const n = NATURES[nature] || NATURES['Hardy'];
  if (!n.inc && !n.dec) return 1;
  if (n.inc === statKey) return 1.1;
  if (n.dec === statKey) return 0.9;
  return 1;
}

function calcHP(base, iv, ev, level) {
  return Math.floor(((2*base + iv + Math.floor(ev/4)) * level)/100) + level + 10;
}

function calcOther(base, iv, ev, level, mult) {
  return Math.floor((Math.floor(((2*base + iv + Math.floor(ev/4)) * level)/100) + 5) * mult);
}

function getBaseStatsFor(slotOrPokemon, formIndex) {
  let baseArr = null;
  if (formIndex !== undefined && formIndex !== null && formIndex !== 'base') {
    const f = (slotOrPokemon.Forms || [])[Number(formIndex)];
    if (f && f.BaseStats) baseArr = f.BaseStats;
  }
  if (!baseArr && slotOrPokemon.BaseStats) baseArr = slotOrPokemon.BaseStats;
  if (!baseArr) return null;
  return {
    hp: Number(baseArr[0] || 0),
    atk: Number(baseArr[1] || 0),
    def: Number(baseArr[2] || 0),
    spe: Number(baseArr[3] || 0),
    spa: Number(baseArr[4] || 0),
    spd: Number(baseArr[5] || 0)
  };
}

function computeStats({baseStats, ivs, evs, level, nature}) {
  const res = {};
  res.hp = calcHP(baseStats.hp, ivs.hp, evs.hp, level);
  res.atk = calcOther(baseStats.atk, ivs.atk, evs.atk, level, natureMultiplier(nature,'atk'));
  res.def = calcOther(baseStats.def, ivs.def, evs.def, level, natureMultiplier(nature,'def'));
  res.spa = calcOther(baseStats.spa, ivs.spa, evs.spa, level, natureMultiplier(nature,'spa'));
  res.spd = calcOther(baseStats.spd, ivs.spd, evs.spd, level, natureMultiplier(nature,'spd'));
  res.spe = calcOther(baseStats.spe, ivs.spe, evs.spe, level, natureMultiplier(nature,'spe'));
  return res;
}

async function init() {
  try {
    const [pResp, mResp] = await Promise.all([
      fetch(`./games/${game}/data/pokemon_master_evo.json`),
      fetch(`./games/${game}/data/moves.json`)
    ]);
    allPokemon = await pResp.json();
    allMoves = await mResp.json();
    normalizedList = allPokemon.map(p => normalizePokemon(p));

    createTeamSlots();
    renderResults(normalizedList, allPokemon);
    wireControls();
    loadTeam();
  } catch (err) {
    document.getElementById('results-container').innerHTML = `<p>Error loading Pokémon data for ${game}</p>`;
    console.error(err);
  }
}

function createTeamSlots() {
  const grid = document.getElementById('team-grid');
  grid.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const slot = document.createElement('div');
    slot.className = 'team-slot';
    slot.dataset.index = i;

    const img = document.createElement('img');
    img.className = 'slot-image';
    img.alt = 'Empty';
    img.src = `./games/${game}/images/Front/000.png`;
    img.onerror = function() { this.onerror = null; this.src = `./games/${game}/images/Front/000.png`; };

    const name = document.createElement('div');
    name.className = 'slot-name';
    name.textContent = 'Empty';

    const btns = document.createElement('div');
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', (e) => { e.stopPropagation(); renderEditorForSlot(i); });

    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', (e) => { e.stopPropagation(); removeSlot(i); });

    btns.appendChild(editBtn);
    btns.appendChild(removeBtn);

    slot.appendChild(img);
    slot.appendChild(name);
    slot.appendChild(btns);

    slot.addEventListener('click', () => { renderEditorForSlot(i); });

    grid.appendChild(slot);
  }
  refreshTeamUI();
}

function renderResults(normalized, original) {
  // Results list is hidden in this view; keep function for compatibility
  const container = document.getElementById('results-container');
  if (!container) return;
  container.innerHTML = '';
}

function addToFirstEmpty(pokemon) {
  const idx = currentTeam.findIndex(s => !s);
  if (idx === -1) { showStatus('Team is full (6)'); return; }
  currentTeam[idx] = {
    InternalName: pokemon.InternalName,
    Name: pokemon.Name,
    data: pokemon,
    nick: '',
    level: 50,
    ability: '',
    item: '',
    form: null,
    moves: [],
    ivs: { hp:31, atk:31, def:31, spa:31, spd:31, spe:31 },
    evs: { hp:0, atk:0, def:0, spa:0, spd:0, spe:0 },
    nature: 'Hardy'
  };
  refreshTeamUI();
  saveTeam();
}  

function refreshTeamUI() {
  const slots = document.querySelectorAll('.team-slot');
  slots.forEach(slot => {
    const i = Number(slot.dataset.index);
    const content = currentTeam[i];
    const img = slot.querySelector('.slot-image');
    const name = slot.querySelector('.slot-name');
    if (content) {
      slot.classList.add('filled');
      img.src = `./games/${game}/images/Front/${content.InternalName}.png`;
      img.onerror = function() {
        // Try T variant, then fallback to 000.png
        if (this.src && this.src.endsWith('T.png')) {
          this.onerror = null;
          this.src = `./games/${game}/images/Front/000.png`;
        } else {
          this.src = `./games/${game}/images/Front/${content.InternalName}T.png`;
        }
      };
      name.textContent = content.Name;
    } else {
      slot.classList.remove('filled');
      img.src = `./games/${game}/images/Front/000.png`;
      img.onerror = function() { this.onerror = null; this.src = `./games/${game}/images/Front/000.png`; };
      name.textContent = 'Empty';
    }
  });
}

function removeSlot(i) {
  currentTeam[i] = null;
  refreshTeamUI();
  saveTeam();
}

// Keep slot modal but also allow inline editor; this function still works for editing a team slot
function openSlotModal(i) {
  editingSlot = i;
  const modal = document.getElementById('slot-modal');
  const slot = currentTeam[i];
  if (!slot) { showStatus('Slot is empty; use the editor to add a Pokémon'); return; }
  document.getElementById('slot-nick').value = slot?.nick || '';
  document.getElementById('slot-level').value = slot?.level || 50;

  // Populate forms select
  const formSelect = document.getElementById('slot-form');
  formSelect.innerHTML = '<option value="base">Base</option>';
  if (slot && slot.data && Array.isArray(slot.data.Forms) && slot.data.Forms.length) {
    slot.data.Forms.forEach((f, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = f.FormName || `Form ${idx+1}`;
      formSelect.appendChild(opt);
    });
  }
  if (slot && slot.form !== null && slot.form !== undefined) formSelect.value = slot.form === null ? 'base' : slot.form;

  // Populate ability select (depends on selected form)
  function populateAbilities() {
    const abilitySelect = document.getElementById('slot-ability');
    abilitySelect.innerHTML = '';
    let abilities = [];
    if (formSelect.value !== 'base') {
      const f = slot.data.Forms[Number(formSelect.value)];
      abilities = (f && (f.Abilities || '') ? (f.Abilities||'').split(',').map(a=>a.trim()) : []);
      const hidden = (f && (f.HiddenAbilities || f.HiddenAbility) ? (f.HiddenAbilities||f.HiddenAbility).split(',').map(a=>a.trim()) : []);
      hidden.forEach(h => { if (h && !abilities.includes(h)) abilities.push(h + ' (Hidden)'); });
    }
    if (!abilities.length && slot && slot.data && slot.data.Abilities) {
      abilities = (slot.data.Abilities || '').split(',').map(a => a.trim()).filter(Boolean);
      const hidden = (slot.data.HiddenAbilities || slot.data.HiddenAbility || '').split(',').map(a=>a.trim()).filter(Boolean);
      hidden.forEach(h => { if (h && !abilities.includes(h)) abilities.push(h + ' (Hidden)'); });
    }
    abilities.forEach(a => { const opt = document.createElement('option'); opt.value = a.replace(/ \(Hidden\)$/, ''); opt.textContent = a; abilitySelect.appendChild(opt); });
    // set current ability if present
    if (slot && slot.ability) abilitySelect.value = slot.ability;
  }

  formSelect.onchange = () => {
    populateAbilities();

    // Update allowed moves when form changes
    const val = formSelect.value;
    let avail = [];
    if (val !== 'base') {
      const f = slot.data.Forms[Number(val)];
      if (f) {
        const fake = Object.assign({}, slot.data, f);
        try { avail = normalizePokemon(fake).Moves.map(m=>m.toLowerCase()); } catch (e) { avail = []; }
      }
    }
    if (!avail.length) {
      try { avail = normalizePokemon(slot.data).Moves.map(m=>m.toLowerCase()); } catch(e){ avail = []; }
    }
    slot.allowedMoves = avail;
    const ms = document.getElementById('move-search');
    renderMoveResults(ms ? ms.value : '');
  };

  // Determine allowed moves (from pokemon_master_evo via normalize) for initial selection
  try {
    const normalized = normalizePokemon(slot.data);
    slot.allowedMoves = Array.isArray(normalized.Moves) ? normalized.Moves.map(m=>m.toLowerCase()) : [];
  } catch (e) {
    slot.allowedMoves = [];
  }

  // Render current moves
  renderMovesList(i);

  // Populate advanced toggle and controls
  const advToggle = document.getElementById('slot-advanced-toggle');
  const adv = document.getElementById('slot-advanced');
  if (advToggle && adv) {
    adv.classList.add('hidden');
    advToggle.onclick = () => { adv.classList.toggle('hidden'); updateModalStatPreview(); };
  }

  // Populate IV/EV/Nature controls
  const nSelect = document.getElementById('slot-nature');
  if (nSelect) {
    nSelect.innerHTML = Object.keys(NATURES).map(n => `<option value="${n}">${n}</option>`).join('');
    nSelect.value = slot.nature || 'Hardy';
    nSelect.addEventListener('change', () => updateModalStatPreview());
  }
  // IV inputs
  const ivs = slot.ivs || { hp:31, atk:31, def:31, spa:31, spd:31, spe:31 };
  const evs = slot.evs || { hp:0, atk:0, def:0, spa:0, spd:0, spe:0 };
  ['hp','atk','def','spa','spd','spe'].forEach(stat => {
    const ivEl = document.getElementById(`iv-${stat}`);
    const evEl = document.getElementById(`ev-${stat}`);
    const statEl = document.getElementById(`stat-${stat}`);
    if (ivEl) { ivEl.value = (ivs[stat]||0); ivEl.addEventListener('input', () => updateModalStatPreview()); }
    if (evEl) { evEl.value = (evs[stat]||0); evEl.addEventListener('input', () => { validateEVTotals(); updateModalStatPreview(); }); }
    if (statEl) statEl.textContent = '-';
  });
  const evTotalEl = document.getElementById('ev-total'); if (evTotalEl) evTotalEl.textContent = Object.values(evs).reduce((a,b)=>a+Number(b||0),0);
  // level changes update preview
  const levelEl = document.getElementById('slot-level'); if (levelEl) levelEl.addEventListener('input', () => updateModalStatPreview());

  updateModalStatPreview();

  modal.classList.remove('hidden');
} 


function closeSlotModal() {
  editingSlot = null;
  document.getElementById('slot-modal').classList.add('hidden');
}

function saveSlotFromModal() {
  if (editingSlot === null) return;
  const nick = document.getElementById('slot-nick').value.trim();
  const level = Number(document.getElementById('slot-level').value) || 50;
  const ability = document.getElementById('slot-ability').value || '';
  const formVal = document.getElementById('slot-form').value || 'base';
  const nature = (document.getElementById('slot-nature') && document.getElementById('slot-nature').value) || 'Hardy';
  if (!currentTeam[editingSlot]) return closeSlotModal();
  const slot = currentTeam[editingSlot];
  slot.nick = nick;
  slot.level = level;
  slot.ability = ability;
  slot.form = formVal === 'base' ? null : formVal;
  slot.nature = nature;
  // save IVs/EVs
  ['hp','atk','def','spa','spd','spe'].forEach(stat => {
    const ivEl = document.getElementById(`iv-${stat}`);
    const evEl = document.getElementById(`ev-${stat}`);
    if (ivEl) slot.ivs = slot.ivs || {}, slot.ivs[stat] = Number(ivEl.value) || 0;
    if (evEl) slot.evs = slot.evs || {}, slot.evs[stat] = Math.max(0, Math.min(252, Number(evEl.value) || 0));
  });
  // Enforce 510 total EVs; trim extras from last stats if needed
  const totalEV = Object.values(slot.evs).reduce((a,b)=>a+Number(b||0),0);
  if (totalEV > 510) {
    let excess = totalEV - 510;
    const order = ['hp','atk','def','spa','spd','spe']; // trim from highest priority stats
    for (let i = order.length - 1; i >= 0; i--) {
      if (excess <= 0) break;
      const s = order[i];
      const take = Math.min(slot.evs[s], excess);
      slot.evs[s] -= take;
      excess -= take;
    }
    showStatus('EV total exceeded 510; extra EVs trimmed');
  }

  refreshTeamUI();
  saveTeam();
  showStatus('Slot saved');
  closeSlotModal();
} 

function wireControls() {
  const $ = id => document.getElementById(id);

  const searchBar = $('search-bar');
  if (searchBar) {
    searchBar.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      performSearch();
    });
    // keyboard navigation over inline results
    searchBar.addEventListener('keydown', (e) => {
      const results = document.getElementById('search-results');
      if (!searchMatches || !searchMatches.length) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); searchIndex = 0; renderEditorForPokemon(searchMatches[searchIndex]); showSearchMatches(searchMatches); const rows = results.querySelectorAll('.search-row'); if (rows[0]) rows[0].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); searchIndex = (searchIndex>0?searchIndex-1:searchMatches.length-1); renderEditorForPokemon(searchMatches[searchIndex]); showSearchMatches(searchMatches); const rows = results.querySelectorAll('.search-row'); if (rows[searchIndex]) rows[searchIndex].focus(); }
      else if (e.key === 'Escape') { if (results) results.innerHTML = ''; }
    });

    // Close results when clicking outside the top-search area
    document.addEventListener('click', (ev) => {
      const top = document.getElementById('top-search');
      const results = document.getElementById('search-results');
      if (!top || !results) return;
      if (!top.contains(ev.target) && !results.contains(ev.target)) {
        results.innerHTML = '';
        results.style.display = 'none';
      }
    });

  } else console.warn('search-bar not found');

  const resetBtn = $('reset-button');
  if (resetBtn) resetBtn.addEventListener('click', () => { if ($('search-bar')) $('search-bar').value = ''; renderResults(normalizedList, allPokemon); showSearchMatches([]); });

  const findBtn = $('find-button'); if (findBtn) findBtn.addEventListener('click', () => {
    const q = (document.getElementById('search-bar').value || '').toLowerCase().trim();
    const nameQ = (document.getElementById('name-search').value || '').toLowerCase().trim();
    const typeQ = (document.getElementById('type-search').value || '').toLowerCase().trim();
    const abilityQ = (document.getElementById('ability-search').value || '').toLowerCase().trim();
    const combined = `${q}|${nameQ}|${typeQ}|${abilityQ}`;
    if (lastSearchQuery && lastSearchQuery === combined && searchMatches && searchMatches.length) {
      changeSearchIndex(1);
    } else {
      performSearch();
    }
  });
  const prevBtn = $('prev-match'); if (prevBtn) prevBtn.addEventListener('click', () => changeSearchIndex(-1));
  const nextBtn = $('next-match'); if (nextBtn) nextBtn.addEventListener('click', () => changeSearchIndex(1));

  // Enter key behavior: run search or cycle results
  if (searchBar) searchBar.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); performSearch(); }
  });
  ['name-search','type-search','ability-search'].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); performSearch(); } });
  });

  const modalClose = $('modal-close'); if (modalClose) modalClose.addEventListener('click', closeSlotModal); else console.warn('modal-close not found');
  const slotSave = $('slot-save'); if (slotSave) slotSave.addEventListener('click', saveSlotFromModal); else console.warn('slot-save not found');
  const slotRemove = $('slot-remove'); if (slotRemove) slotRemove.addEventListener('click', () => { if (editingSlot !== null) removeSlot(editingSlot); closeSlotModal(); });

  const saveTeamBtn = $('save-team'); if (saveTeamBtn) saveTeamBtn.addEventListener('click', () => saveTeam(true));
  const exportBtn = $('export-team'); if (exportBtn) exportBtn.addEventListener('click', exportTeam);
  const importBtn = $('import-team'); if (importBtn) importBtn.addEventListener('click', () => { const f = $('import-file'); if (f) f.click(); });
  const importFile = $('import-file'); if (importFile) importFile.addEventListener('change', importTeamFromFile);

  // Move picker and type chart wiring (some elements live inside modal; guard them)
  const editMovesBtn = $('edit-moves'); if (editMovesBtn) editMovesBtn.addEventListener('click', () => openMovePicker());
  const editorEditMoves = $('editor-edit-moves'); if (editorEditMoves) editorEditMoves.addEventListener('click', () => openMovePicker());
  const movePickerClose = $('move-picker-close'); if (movePickerClose) movePickerClose.addEventListener('click', () => closeMovePicker());
  const moveSearch = $('move-search'); if (moveSearch) moveSearch.addEventListener('input', (e) => renderMoveResults(e.target.value));
  const typeChartBtn = $('type-chart-button'); if (typeChartBtn) typeChartBtn.addEventListener('click', () => openTypeChart());
  const typeChartClose = $('type-chart-close'); if (typeChartClose) typeChartClose.addEventListener('click', () => { const t = $('type-chart-modal'); if (t) t.classList.add('hidden'); });
}

function getMoveByName(name) {
  if (!name) return null;
  return allMoves.find(m => m.Name && m.Name.toLowerCase() === name.toLowerCase());
}

// Helper to create a type icon image element for UI lists
function createTypeImg(type) {
  if (!type) return null;
  const t = String(type).toUpperCase();
  const img = document.createElement('img');
  img.src = `./games/${game}/images/Types/${t}.png`;
  img.alt = t;
  img.style.width = '20px';
  img.style.height = '20px';
  img.style.marginRight = '6px';
  img.className = 'type-icon';
  img.onerror = function() { this.onerror = null; this.style.display = 'none'; };
  return img;
}

function updateEditorAddButtonText() {
  const addBtn = document.getElementById('editor-add-to-team');
  if (!addBtn) return;
  if (editingSlot !== null) addBtn.textContent = 'Save to Slot';
  else addBtn.textContent = 'Add to Team';
}

function renderEditorForSlot(index) {
  const slot = currentTeam[index];
  if (!slot) { showStatus('Slot is empty. Use the editor to add a Pokémon.'); return; }
  // set editing slot and populate editor as if the candidate was this slot
  editingSlot = index;
  editingCandidate = {
    data: slot.data,
    InternalName: slot.InternalName,
    Name: slot.Name,
    nick: slot.nick || '',
    level: slot.level || 50,
    ability: slot.ability || '',
    item: slot.item || '',
    form: (slot.form === null || slot.form === undefined) ? 'base' : String(slot.form),
    moves: Array.isArray(slot.moves) ? slot.moves.slice() : [],
    allowedMoves: slot.allowedMoves || [],
    ivs: slot.ivs || {hp:31,atk:31,def:31,spa:31,spd:31,spe:31},
    evs: slot.evs || {hp:0,atk:0,def:0,spa:0,spd:0,spe:0},
    nature: slot.nature || 'Hardy'
  };
  // render base Pokemon UI
  renderEditorForPokemon(slot.data);

  // restore slot-specific data
  editingCandidate.nick = slot.nick || '';
  editingCandidate.level = slot.level || 50;
  editingCandidate.ability = slot.ability || '';
  editingCandidate.item = slot.item || '';
  editingCandidate.form = (slot.form === null || slot.form === undefined) ? 'base' : String(slot.form);
  editingCandidate.moves = Array.isArray(slot.moves) ? slot.moves.slice() : [];
  editingCandidate.allowedMoves = slot.allowedMoves || [];
  editingCandidate.ivs = slot.ivs || {hp:31,atk:31,def:31,spa:31,spd:31,spe:31};
  editingCandidate.evs = slot.evs || {hp:0,atk:0,def:0,spa:0,spd:0,spe:0};
  editingCandidate.nature = slot.nature || 'Hardy';

  // set UI fields
  const levelEl = document.getElementById('editor-level'); if (levelEl) levelEl.value = editingCandidate.level;
  const formSel = document.getElementById('editor-form'); if (formSel) formSel.value = editingCandidate.form || 'base';
  // ability select will be populated by formSelect.onchange, but set value if possible
  const abilitySel = document.getElementById('editor-ability'); if (abilitySel) abilitySel.value = editingCandidate.ability || '';
  // moves
  renderMovesList(null, 'candidate');
  // editor advanced values
  const adv = document.getElementById('editor-advanced'); if (adv && !adv.classList.contains('hidden')) { updateEditorStatPreview(); }
}

function performSearch() {
  const q = (document.getElementById('search-bar').value || '').toLowerCase().trim();
  const nameQ = (document.getElementById('name-search').value || '').toLowerCase().trim();
  const typeQ = (document.getElementById('type-search').value || '').toLowerCase().trim();
  const abilityQ = (document.getElementById('ability-search').value || '').toLowerCase().trim();

  // If user pressed Enter repeatedly with same query, just advance to next match
  if (lastSearchQuery && lastSearchQuery === `${q}|${nameQ}|${typeQ}|${abilityQ}` && searchMatches && searchMatches.length) {
    changeSearchIndex(1);
    return;
  }

  const filtered = normalizedList.filter(p => {
    const nameMatch = !nameQ || p.Name.includes(nameQ) || (p.Forms||[]).some(f => f.name.includes(nameQ));
    const typeMatch = !typeQ || (p.Types||[]).some(t => t.includes(typeQ)) || (p.Forms||[]).some(f => (f.types||[]).some(t=>t.includes(typeQ)));
    const abilityMatch = !abilityQ || (p.Abilities||[]).some(a => a.includes(abilityQ)) || (p.Forms||[]).some(f => (f.abilities||[]).some(a=>a.includes(abilityQ)));
    const freeText = !q || p.Name.includes(q) || (p.Types||[]).some(t=>t.includes(q)) || (p.Abilities||[]).some(a=>a.includes(q)) || (p.Moves||[]).some(m=>m.includes(q)) || (p.Forms||[]).some(f=> f.name.includes(q) || (f.abilities||[]).some(a=>a.includes(q)));
    return nameMatch && typeMatch && abilityMatch && freeText;
  });

  const matches = filtered.map(n => findMatchingOriginal(n, allPokemon)).filter(Boolean);
  searchMatches = matches;
  if (matches.length) searchIndex = 0; else searchIndex = -1;
  showSearchMatches(matches);
  lastSearchQuery = `${q}|${nameQ}|${typeQ}|${abilityQ}`;
  if (searchIndex >= 0) renderEditorForPokemon(matches[searchIndex]);
}

function changeSearchIndex(delta) {
  if (!searchMatches || !searchMatches.length) return;
  searchIndex = (searchIndex + delta + searchMatches.length) % searchMatches.length;
  showSearchMatches(searchMatches);
  renderEditorForPokemon(searchMatches[searchIndex]);
}

function showSearchMatches(matches) {
  const mc = document.getElementById('match-count');
  const thumbs = document.getElementById('match-thumbs');
  const prev = document.getElementById('prev-match');
  const next = document.getElementById('next-match');
  const results = document.getElementById('search-results');
  if (!mc) return;
  if (!matches || !matches.length) {
    mc.textContent = 'No results';
    if (thumbs) thumbs.innerHTML = '';
    if (results) {
      results.innerHTML = '';
      results.style.display = 'none';
    }
    if (prev) prev.disabled = true;
    if (next) next.disabled = true;
    searchIndex = -1;
    return;
  }
  mc.textContent = `${(searchIndex >= 0 ? searchIndex+1 : 0)} / ${matches.length}`;

  // render thumbnails
  if (thumbs) {
    thumbs.innerHTML = '';
    matches.slice(0, 12).forEach((m, idx) => {
      const img = document.createElement('img');
      img.src = `./games/${game}/images/Front/${m.InternalName}.png`;
      img.onerror = function() { this.onerror = null; this.src = `./games/${game}/images/Front/${m.InternalName}T.png`; };
      img.title = m.Name;
      img.classList.toggle('selected', idx === searchIndex);
      img.addEventListener('click', () => { searchIndex = idx; renderEditorForPokemon(matches[searchIndex]); showSearchMatches(matches); });
      thumbs.appendChild(img);
    });
  }

  // render list results (friendly UI)
  if (results) {
    results.innerHTML = '';
    results.style.display = 'flex';
    // add close button
    const close = document.createElement('button'); close.className = 'close-btn'; close.innerHTML = '×'; close.title='Close'; close.addEventListener('click', () => { results.innerHTML = ''; results.style.display = 'none'; if (thumbs) thumbs.style.display = ''; }); results.appendChild(close);

    // hide thumbs to avoid clutter
    if (thumbs) thumbs.style.display = 'none';

    matches.forEach((m, idx) => {
      const r = document.createElement('div');
      r.className = 'search-row';
      if (idx === searchIndex) r.classList.add('selected');
      const img = document.createElement('img');
      img.src = `./games/${game}/images/Front/${m.InternalName}.png`;
      img.onerror = function() { this.onerror = null; this.src = `./games/${game}/images/Front/${m.InternalName}T.png`; };
      const meta = document.createElement('div'); meta.className = 'meta';
      const title = document.createElement('div'); title.className='name'; title.textContent = m.Name;
      const types = document.createElement('div'); types.className = 'types'; (m.Type1 ? types.appendChild(createTypeImg(m.Type1)) : null); (m.Type2 ? types.appendChild(createTypeImg(m.Type2)) : null);
      const abs = (m.Abilities || '').split(',').map(a=>a.trim()).filter(Boolean);
      const hidden = (m.HiddenAbilities || m.HiddenAbility || '').split(',').map(a=>a.trim()).filter(Boolean);
      const abilityText = abs.join(', ') + (hidden.length ? ` (Hidden: ${hidden.join(', ')})` : '');
      const ability = document.createElement('div'); ability.className = 'ability'; ability.textContent = abilityText;
      meta.appendChild(title); meta.appendChild(types); meta.appendChild(ability);

      r.appendChild(img); r.appendChild(meta);
      r.tabIndex = 0;
      r.addEventListener('click', () => { searchIndex = idx; renderEditorForPokemon(matches[searchIndex]); results.innerHTML = ''; results.style.display = 'none'; if (thumbs) thumbs.style.display = ''; });
      r.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); searchIndex = idx; renderEditorForPokemon(matches[searchIndex]); results.innerHTML = ''; results.style.display = 'none'; if (thumbs) thumbs.style.display = ''; } });
      results.appendChild(r);
    });
  }

  if (prev) prev.disabled = (matches.length <= 1);
  if (next) next.disabled = (matches.length <= 1);
}

function updateEditorStatPreview() {
  if (!editingCandidate || !editingCandidate.data) return;
  const lvl = Number(document.getElementById('editor-level') ? document.getElementById('editor-level').value : 50);
  const formVal = document.getElementById('editor-form') ? document.getElementById('editor-form').value : 'base';
  const baseStats = getBaseStatsFor(editingCandidate.data, formVal);
  if (!baseStats) return;

  const computed = computeStats({ baseStats, ivs: editingCandidate.ivs || {hp:31,atk:31,def:31,spa:31,spd:31,spe:31}, evs: editingCandidate.evs || {hp:0,atk:0,def:0,spa:0,spd:0,spe:0}, level: lvl, nature: editingCandidate.nature || 'Hardy' });
  const el = document.getElementById('editor-stat-values');
  if (el) el.innerHTML = `<strong>Computed</strong> • HP:${computed.hp} • ATK:${computed.atk} • DEF:${computed.def} • SPA:${computed.spa} • SPD:${computed.spd} • SPE:${computed.spe}`;
  ['hp','atk','def','spa','spd','spe'].forEach(s => { const se = document.getElementById(`editor-stat-${s}`); if (se) se.textContent = computed[s]; });
  const evTotalEl = document.getElementById('editor-ev-total'); if (evTotalEl) evTotalEl.textContent = Object.values(editingCandidate.evs||{hp:0,atk:0,def:0,spa:0,spd:0,spe:0}).reduce((a,b)=>a+Number(b||0),0);
}

function validateEditorEVTotals() {
  const vals = ['hp','atk','def','spa','spd','spe'].map(s => Number(document.getElementById(`editor-ev-${s}`) ? document.getElementById(`editor-ev-${s}`).value : 0));
  const total = vals.reduce((a,b)=>a+b,0);
  const out = document.getElementById('editor-ev-total'); if (out) out.textContent = total;
  if (total > 510) showStatus('Editor EV total exceeds 510; please reduce EVs');
}

function renderEditorForPokemon(pokemon) {
  const empty = document.getElementById('editor-empty');
  const card = document.getElementById('editor-card');
  if (!pokemon) {
    if (card) card.classList.add('hidden');
    if (empty) empty.style.display = 'block';
    const img = document.getElementById('editor-image'); if (img) { img.src = `./games/${game}/images/Front/000.png`; img.onerror = function(){ this.onerror=null; this.src=`./games/${game}/images/Front/000.png`; } }
    editingCandidate = null;
    return;
  }
  if (empty) empty.style.display = 'none';
  if (card) card.classList.remove('hidden');

  editingCandidate = {
    data: pokemon,
    InternalName: pokemon.InternalName,
    Name: pokemon.Name,
    nick: '',
    level: 50,
    ability: '',
    item: '',
    form: 'base',
    moves: [],
    allowedMoves: [],
    ivs: { hp:31, atk:31, def:31, spa:31, spd:31, spe:31 },
    evs: { hp:0, atk:0, def:0, spa:0, spd:0, spe:0 },
    nature: 'Hardy'
  }; 

  // Image & name
  const img = document.getElementById('editor-image'); if (img) { img.src = `./games/${game}/images/Front/${pokemon.InternalName}.png`; img.onerror = function(){
    // If primary missing, try T variant; if T variant missing, fall back to 000.png
    if (this.src && this.src.endsWith('T.png')) {
      this.onerror = null;
      this.src = `./games/${game}/images/Front/000.png`;
    } else {
      this.src = `./games/${game}/images/Front/${pokemon.InternalName}T.png`;
    }
  }; img.alt = pokemon.Name; }
  const nameEl = document.getElementById('editor-name'); if (nameEl) nameEl.textContent = pokemon.Name;

  // Types
  const typesEl = document.getElementById('editor-types'); if (typesEl) { typesEl.innerHTML = ''; const t1 = pokemon.Type1; const t2 = pokemon.Type2; [t1,t2].filter(Boolean).forEach(t => { const img = document.createElement('img'); img.src = `./games/${game}/images/Types/${t}.png`; img.alt = t; img.className = 'type-icon'; img.onerror = function(){ this.onerror=null; this.style.display='none'; }; typesEl.appendChild(img); }); }

  // Abilities (include hidden ability if present) — use a select so user can pick immediately
  const abilitiesEl = document.getElementById('editor-ability'); if (abilitiesEl) {
    abilitiesEl.innerHTML = '<option value="">(choose)</option>';
    const abilities = (pokemon.Abilities || '').split(',').map(a => a.trim()).filter(Boolean);
    const hidden = (pokemon.HiddenAbilities || pokemon.HiddenAbility || '').split(',').map(a => a.trim()).filter(Boolean);
    abilities.forEach(a => { const opt = document.createElement('option'); opt.value = a; opt.textContent = a; abilitiesEl.appendChild(opt); });
    hidden.forEach(h => { const opt = document.createElement('option'); opt.value = h; opt.textContent = h + ' (Hidden)'; abilitiesEl.appendChild(opt); });
    // set candidate ability if present
    if (editingCandidate && editingCandidate.ability) abilitiesEl.value = editingCandidate.ability;
    abilitiesEl.addEventListener('change', () => { if (editingCandidate) editingCandidate.ability = abilitiesEl.value; });
  }

  // Forms select
  const formSelect = document.getElementById('editor-form');
  formSelect.innerHTML = '<option value="base">Base</option>';
  if (Array.isArray(pokemon.Forms) && pokemon.Forms.length) {
    pokemon.Forms.forEach((f, idx) => { const opt = document.createElement('option'); opt.value = idx; opt.textContent = f.FormName || `Form ${idx+1}`; formSelect.appendChild(opt); });
  }
  formSelect.value = 'base';

  formSelect.onchange = () => {
    const val = formSelect.value;
    // update ability select
    const abilityEl = document.getElementById('editor-ability');
    if (abilityEl) {
      abilityEl.innerHTML = '<option value="">(choose)</option>';
      if (val !== 'base') {
        const f = pokemon.Forms[Number(val)];
        const abs = (f && (f.Abilities || '') ? (f.Abilities||'').split(',').map(a=>a.trim()) : []);
        const hidden = (f && (f.HiddenAbilities || f.HiddenAbility) ? (f.HiddenAbilities||f.HiddenAbility).split(',').map(a=>a.trim()) : []);
        abs.forEach(a => { const opt = document.createElement('option'); opt.value = a; opt.textContent = a; abilityEl.appendChild(opt); });
        hidden.forEach(h => { const opt = document.createElement('option'); opt.value = h; opt.textContent = h + ' (Hidden)'; abilityEl.appendChild(opt); });
      } else {
        const abs = (pokemon.Abilities || '').split(',').map(a => a.trim()).filter(Boolean);
        const hidden = (pokemon.HiddenAbilities || pokemon.HiddenAbility || '').split(',').map(a=>a.trim()).filter(Boolean);
        abs.forEach(a => { const opt = document.createElement('option'); opt.value = a; opt.textContent = a; abilityEl.appendChild(opt); });
        hidden.forEach(h => { const opt = document.createElement('option'); opt.value = h; opt.textContent = h + ' (Hidden)'; abilityEl.appendChild(opt); });
      }
      abilityEl.value = editingCandidate.ability || '';
      abilityEl.addEventListener('change', () => { if (editingCandidate) editingCandidate.ability = abilityEl.value; });
    }

    // update allowed moves when form changes
    if (val !== 'base') {
      const f = pokemon.Forms[Number(val)];
      const fake = Object.assign({}, pokemon, f);
      try { editingCandidate.allowedMoves = normalizePokemon(fake).Moves.map(m=>m.toLowerCase()); } catch(e){ editingCandidate.allowedMoves = []; }
    } else {
      try { editingCandidate.allowedMoves = normalizePokemon(pokemon).Moves.map(m=>m.toLowerCase()); } catch(e){ editingCandidate.allowedMoves = []; }
    }
    renderMovesList(null,'candidate');
    updateEditorStatPreview();
  };

  // initialize allowed moves
  try { editingCandidate.allowedMoves = normalizePokemon(pokemon).Moves.map(m=>m.toLowerCase()); } catch(e) { editingCandidate.allowedMoves = []; }

  // moves
  renderMovesList(null, 'candidate');

  // level select
  const levelEl = document.getElementById('editor-level'); if (levelEl) { levelEl.value = 50; levelEl.addEventListener('input', () => updateEditorStatPreview()); }

  // initial editor stat preview
  updateEditorStatPreview();

  // Advanced inline editor wiring (always visible now)
  const adv = document.getElementById('editor-advanced');
  if (adv) {
    // populate nature select
    const nsel = document.getElementById('editor-nature'); if (nsel) { nsel.innerHTML = Object.keys(NATURES).map(n=>`<option value="${n}">${n}</option>`).join(''); nsel.value = editingCandidate.nature || 'Hardy'; nsel.addEventListener('change', () => { editingCandidate.nature = nsel.value; updateEditorStatPreview(); }); }
    // iv/ev inputs
    ['hp','atk','def','spa','spd','spe'].forEach(stat => {
      const iv = document.getElementById(`editor-iv-${stat}`);
      const ev = document.getElementById(`editor-ev-${stat}`);
      const statEl = document.getElementById(`editor-stat-${stat}`);
      if (iv) { iv.value = editingCandidate.ivs ? editingCandidate.ivs[stat] : 31; iv.addEventListener('input', () => { editingCandidate.ivs = editingCandidate.ivs || {}; editingCandidate.ivs[stat] = Math.max(0, Math.min(31, Number(iv.value)||0)); updateEditorStatPreview(); }); }
      if (ev) { ev.value = editingCandidate.evs ? editingCandidate.evs[stat] : 0; ev.addEventListener('input', () => { editingCandidate.evs = editingCandidate.evs || {}; editingCandidate.evs[stat] = Math.max(0, Math.min(252, Number(ev.value)||0)); validateEditorEVTotals(); updateEditorStatPreview(); }); }
      if (statEl) statEl.textContent = '-';
    });
    const evTotalEl = document.getElementById('editor-ev-total'); if (evTotalEl) evTotalEl.textContent = Object.values(editingCandidate.evs||{hp:0,atk:0,def:0,spa:0,spd:0,spe:0}).reduce((a,b)=>a+Number(b||0),0);
  }

  // editor controls
  const editMovesBtn = document.getElementById('editor-edit-moves'); if (editMovesBtn) editMovesBtn.onclick = () => { /* editingCandidate is set */ openMovePicker(); };
  const addBtn = document.getElementById('editor-add-to-team'); if (addBtn) addBtn.onclick = () => {
    // If editing an existing slot via main editor, save to that slot
    if (editingSlot !== null) {
      const obj = Object.assign({}, editingCandidate);
      obj.data = editingCandidate.data;
      currentTeam[editingSlot] = obj;
      showStatus('Slot updated');
      refreshTeamUI();
      saveTeam(true);
      editingSlot = null;
      updateEditorAddButtonText();
      return;
    }

    const slotSel = document.getElementById('editor-slot-select');
    let slotVal = slotSel ? slotSel.value : 'first';
    let index = -1;
    if (slotVal === 'first') index = currentTeam.findIndex(s => !s);
    else index = Number(slotVal);
    if (index < 0 || index > 5) { showStatus('No empty slot found'); return; }

    const obj = Object.assign({}, editingCandidate);
    // embed original data for forms etc
    obj.data = pokemon;
    currentTeam[index] = obj;
    refreshTeamUI();
    saveTeam(true);
    showStatus('Pokémon added to team');
  };

}


function renderMovesList(slotIdx, target='slot') {
  // target: 'slot' uses team slot; 'candidate' uses editingCandidate
  const list = target === 'slot' ? document.getElementById('moves-list') : document.getElementById('editor-moves-list');
  if (!list) return;
  list.innerHTML = '';
  const source = target === 'slot' ? currentTeam[slotIdx] : editingCandidate;
  if (!source || !Array.isArray(source.moves)) return;
  source.moves.forEach((m, idx) => {
    const pill = document.createElement('div');
    pill.className = 'move-pill';
    const mvName = typeof m === 'string' ? m : (m.Name || '');
    const mvObj = getMoveByName(mvName);
    const imgHtml = mvObj && mvObj.Type ? `<img src="./games/${game}/images/Types/${mvObj.Type}.png" alt="${mvObj.Type}" onerror="this.onerror=null;this.style.display='none'" />` : '';
    const info = mvObj ? ` <small class="move-info">P:${mvObj.Power||'-'} A:${mvObj.Accuracy||'-'}</small>` : '';
    pill.innerHTML = `${imgHtml}<span>${mvName}</span>${info}`; 
    const rem = document.createElement('button'); rem.textContent = '×';
    rem.addEventListener('click', (e) => { e.stopPropagation(); if (target === 'slot') removeMoveFromSlot(slotIdx, idx); else removeMoveFromCandidate(idx); });
    pill.appendChild(rem);
    list.appendChild(pill);
  });
}

function openMovePicker() {
  const picker = document.getElementById('move-picker');
  if (!picker) return;
  picker.classList.remove('hidden');
  // Pre-populate move-search with empty and render results according to current context
  const ms = document.getElementById('move-search'); if (ms) ms.value = '';
  renderMoveResults('');
}

function closeMovePicker() {
  const picker = document.getElementById('move-picker');
  picker.classList.add('hidden');
}

function renderMoveResults(query) {
  const container = document.getElementById('move-results');
  const desc = document.getElementById('move-desc');
  container.innerHTML = '';
  if (desc) desc.textContent = '';
  const q = (query || '').toLowerCase().trim();

  // Determine source: prefer editingCandidate, then editingSlot
  let source = editingCandidate;
  if (!source && editingSlot !== null) source = currentTeam[editingSlot];

  // Determine allowed moves
  let allowedSet = null;
  if (source && source.allowedMoves) {
    const allowed = source.allowedMoves;
    allowedSet = allowed.length ? new Set(allowed.map(m=>m.toLowerCase())) : null;
  }

  // Determine target types for STAB indication
  let targetTypes = [];
  if (source) {
    if (source.form !== null && source.form !== undefined && source.form !== 'base') {
      const f = source.data.Forms[Number(source.form)];
      targetTypes = (f && (f.Type1 || f.Type2)) ? [f.Type1, f.Type2].filter(Boolean) : [];
    }
    if (!targetTypes.length) targetTypes = [source.data.Type1, source.data.Type2].filter(Boolean);
  }
  const targetTypesUpper = targetTypes.map(t => t.toUpperCase());

  const results = allMoves.filter(m => {
    if (!m.Name) return false;
    if (allowedSet && allowedSet.size && !allowedSet.has(m.Name.toLowerCase())) return false;
    const nameMatch = m.Name.toLowerCase().includes(q);
    const typeMatch = (m.Type || '').toLowerCase().includes(q);
    return !q || nameMatch || typeMatch;
  }).slice(0,200);

  results.forEach(m => {
    const row = document.createElement('div');
    row.className = 'move-row';
    const selectedMoves = source ? (source.moves || []) : [];
    const isAlready = selectedMoves.some(mv => String(mv).toLowerCase() === String(m.Name || '').toLowerCase());
    if (isAlready) row.classList.add('selected');

    const typeImg = `<img src="./games/${game}/images/Types/${m.Type}.png" alt="${m.Type}" class="type-icon" onerror="this.onerror=null;this.style.display='none'" style="width:22px;height:22px;object-fit:contain;margin-right:8px"/>`;
    const isSTAB = targetTypesUpper && targetTypesUpper.includes((m.Type||'').toUpperCase());
    const stabHtml = isSTAB ? `<span class="stab-badge">STAB</span>` : '';
    row.innerHTML = `${typeImg}<div style="flex:1"><strong>${m.Name}</strong> ${stabHtml}<div style="font-size:12px">${m.Category || ''} • P:${m.Power||'-'} A:${m.Accuracy||'-'}</div></div>`;
    row.addEventListener('click', () => {
      addMoveToSlot(m);
    });
    row.addEventListener('mouseenter', () => { if (desc) desc.textContent = m.Description || ''; });
    row.addEventListener('mouseleave', () => { if (desc) desc.textContent = ''; });
    container.appendChild(row);
  });
}

function addMoveToSlot(moveObj) {
  // Context-aware: if editingCandidate is active, add to candidate; else if modal editing a slot, add to that slot
  if (editingCandidate) {
    if (!editingCandidate.moves) editingCandidate.moves = [];
    if (editingCandidate.moves.length >= 4) { showStatus('Maximum 4 moves'); return; }
    if (editingCandidate.moves.map(m => m.toLowerCase()).includes((moveObj.Name||'').toLowerCase())) { showStatus('Move already selected'); return; }
    editingCandidate.moves.push(moveObj.Name);
    renderMovesList(null, 'candidate');
    showStatus('Move added to candidate');
    return;
  }

  if (editingSlot !== null) {
    const slot = currentTeam[editingSlot];
    if (!slot.moves) slot.moves = [];
    if (slot.moves.length >= 4) { showStatus('Maximum 4 moves'); return; }
    if (slot.moves.map(m => m.toLowerCase()).includes((moveObj.Name||'').toLowerCase())) { showStatus('Move already selected'); return; }
    slot.moves.push(moveObj.Name);
    renderMovesList(editingSlot, 'slot');
    saveTeam();
    showStatus('Move added');
    return;
  }

  showStatus('No active target to add move');
}

function removeMoveFromSlot(slotIdx, moveIndex) {
  const slot = currentTeam[slotIdx];
  if (!slot || !Array.isArray(slot.moves)) return;
  slot.moves.splice(moveIndex, 1);
  renderMovesList(slotIdx, 'slot');
}

function removeMoveFromCandidate(moveIndex) {
  if (!editingCandidate || !Array.isArray(editingCandidate.moves)) return;
  editingCandidate.moves.splice(moveIndex, 1);
  renderMovesList(null, 'candidate');
}

// Type chart data: attacks -> {super, half, immune}
const typeChart = {
  NORMAL: { super:[], half:['ROCK','STEEL'], immune:['GHOST'] },
  FIRE: { super:['GRASS','ICE','BUG','STEEL'], half:['FIRE','WATER','ROCK','DRAGON'], immune:[] },
  WATER: { super:['FIRE','GROUND','ROCK'], half:['WATER','GRASS','DRAGON'], immune:[] },
  ELECTRIC: { super:['WATER','FLYING'], half:['ELECTRIC','GRASS','DRAGON'], immune:['GROUND'] },
  GRASS: { super:['WATER','GROUND','ROCK'], half:['FIRE','GRASS','POISON','FLYING','BUG','DRAGON','STEEL'], immune:[] },
  ICE: { super:['GRASS','GROUND','FLYING','DRAGON'], half:['FIRE','WATER','ICE','STEEL'], immune:[] },
  FIGHTING: { super:['NORMAL','ICE','ROCK','DARK','STEEL'], half:['POISON','FLYING','PSYCHIC','BUG','FAIRY'], immune:['GHOST'] },
  POISON: { super:['GRASS','FAIRY'], half:['POISON','GROUND','ROCK','GHOST'], immune:['STEEL'] },
  GROUND: { super:['FIRE','ELECTRIC','POISON','ROCK','STEEL'], half:['GRASS','BUG'], immune:['FLYING'] },
  FLYING: { super:['GRASS','FIGHTING','BUG'], half:['ELECTRIC','ROCK','STEEL'], immune:[] },
  PSYCHIC: { super:['FIGHTING','POISON'], half:['PSYCHIC','STEEL'], immune:['DARK'] },
  BUG: { super:['GRASS','PSYCHIC','DARK'], half:['FIRE','FIGHTING','POISON','FLYING','GHOST','STEEL','FAIRY'], immune:[] },
  ROCK: { super:['FIRE','ICE','FLYING','BUG'], half:['FIGHTING','GROUND','STEEL'], immune:[] },
  GHOST: { super:['PSYCHIC','GHOST'], half:['DARK'], immune:['NORMAL'] },
  DRAGON: { super:['DRAGON'], half:['STEEL'], immune:['FAIRY'] },
  DARK: { super:['PSYCHIC','GHOST'], half:['FIGHTING','DARK','FAIRY'], immune:[] },
  STEEL: { super:['ICE','ROCK','FAIRY'], half:['FIRE','WATER','ELECTRIC','STEEL'], immune:[] },
  FAIRY: { super:['FIGHTING','DRAGON','DARK'], half:['FIRE','POISON','STEEL'], immune:[] }
};

function updateModalStatPreview() {
  const slot = (editingSlot !== null) ? currentTeam[editingSlot] : null;
  if (!slot) return;
  const formVal = document.getElementById('slot-form') ? document.getElementById('slot-form').value : 'base';
  const ivs = {};
  const evs = {};
  ['hp','atk','def','spa','spd','spe'].forEach(stat => {
    const ivEl = document.getElementById(`iv-${stat}`);
    const evEl = document.getElementById(`ev-${stat}`);
    ivs[stat] = ivEl ? Number(ivEl.value) || 0 : (slot.ivs ? slot.ivs[stat] : 31);
    evs[stat] = evEl ? Number(evEl.value) || 0 : (slot.evs ? slot.evs[stat] : 0);
  });
  const level = Number(document.getElementById('slot-level') ? document.getElementById('slot-level').value : (slot.level || 50));
  const nature = document.getElementById('slot-nature') ? document.getElementById('slot-nature').value : (slot.nature || 'Hardy');
  const baseStats = getBaseStatsFor(slot.data, formVal);
  if (!baseStats) return;
  const computed = computeStats({ baseStats, ivs, evs, level, nature });
  ['hp','atk','def','spa','spd','spe'].forEach(stat => {
    const statEl = document.getElementById(`stat-${stat}`);
    if (statEl) statEl.textContent = computed[stat];
  });
}

function validateEVTotals() {
  const evEls = ['hp','atk','def','spa','spd','spe'].map(s => document.getElementById(`ev-${s}`)).filter(Boolean);
  let total = 0;
  evEls.forEach(e => total += Number(e.value || 0));
  const out = document.getElementById('ev-total'); if (out) out.textContent = total;
  if (total > 510) {
    showStatus('EV total cannot exceed 510; extra EVs will be ignored');
  }
}

function computeDefensiveMultipliers(defTypes) {
  const attackTypes = Object.keys(typeChart);
  const result = {};
  attackTypes.forEach(a => {
    let mul = 1;
    defTypes.forEach(d => {
      if (typeChart[a].immune.includes(d)) mul *= 0;
      else if (typeChart[a].super.includes(d)) mul *= 2;
      else if (typeChart[a].half.includes(d)) mul *= 0.5;
      else mul *= 1;
    });
    result[a] = mul;
  });
  return result;
}

function computeOffensiveCoverage(moveTypes, defenderTypesList) {
  const res = {};
  defenderTypesList.forEach(def => {
    let best = 1;
    moveTypes.forEach(mt => {
      const mults = computeDefensiveMultipliers([def]);
      const m = mults[mt] || 1;
      if (m > best) best = m;
    });
    res[def] = best;
  });
  return res;
}

function openTypeChart() {
  // Use candidate if present, otherwise slot
  let source = editingCandidate;
  if (!source && editingSlot !== null) source = currentTeam[editingSlot];
  if (!source) return;

  let types = [];
  if (source.form !== null && source.form !== undefined && source.form !== 'base') {
    const f = source.data.Forms[Number(source.form)];
    types = (f && (f.Type1 || f.Type2)) ? [f.Type1, f.Type2].filter(Boolean) : [];
  }
  if (!types.length) types = [source.data.Type1, source.data.Type2].filter(Boolean);

  const moveTypes = (source.moves && source.moves.length) ? source.moves.map(mn=> { const mv = getMoveByName(mn); return (mv && mv.Type) ? mv.Type.toUpperCase() : null }).filter(Boolean) : types;

  types = types.map(t => t.toUpperCase());
  const defensive = computeDefensiveMultipliers(types);
  const defenderTypes = Object.keys(typeChart).slice();
  const offensiveCoverage = computeOffensiveCoverage(moveTypes, defenderTypes);

  const body = document.getElementById('type-chart-body');
  body.innerHTML = '';

  // Defensive table
  const defTable = document.createElement('table'); defTable.className = 'type-table';
  defTable.innerHTML = `<thead><tr><th>Attack\\Def</th>${types.map(t=>`<th>${t}</th>`).join('')}</tr></thead>`;
  const tbody = document.createElement('tbody');
  Object.keys(typeChart).forEach(a => {
    const row = document.createElement('tr');
    const first = document.createElement('th'); first.textContent = a;
    row.appendChild(first);
    types.forEach(dt => {
      const td = document.createElement('td');
      const m = computeDefensiveMultipliers([dt])[a];
      td.textContent = m === 0 ? '0' : (m === 0.5 ? '½' : (m === 2 ? '2' : m));
      td.className = m>1 ? 'type-strong' : (m<1 ? 'type-weak' : 'type-neutral');
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });
  defTable.appendChild(tbody);

  // Offensive table
  const offTable = document.createElement('table'); offTable.className = 'type-table';
  offTable.innerHTML = `<thead><tr><th>Target</th><th>Best Multiplier</th></tr></thead>`;
  const offTbody = document.createElement('tbody');
  Object.keys(offensiveCoverage).forEach(def => {
    const r = document.createElement('tr');
    const t1 = document.createElement('td'); t1.textContent = def;
    const t2 = document.createElement('td'); t2.textContent = offensiveCoverage[def];
    t2.className = offensiveCoverage[def]>1 ? 'type-strong' : (offensiveCoverage[def]<1 ? 'type-weak' : 'type-neutral');
    r.appendChild(t1); r.appendChild(t2); offTbody.appendChild(r);
  });
  offTable.appendChild(offTbody);

  body.appendChild(defTable);
  body.appendChild(offTable);
  const modal = document.getElementById('type-chart-modal'); if (modal) modal.classList.remove('hidden');
}


function saveTeam(notify = false) {
  localStorage.setItem(teamKey, JSON.stringify(currentTeam));
  if (notify) showStatus('Team saved');
} 

function loadTeam() {
  const raw = localStorage.getItem(teamKey);
  if (!raw) return;
  try {
    const t = JSON.parse(raw);
    currentTeam = t;
    refreshTeamUI();
  } catch (err) { console.warn('Failed to parse saved team', err); }
}

function exportAsPokepaste(team) {
  let output = '';
  team.forEach(slot => {
    if (!slot) return;
    const name = slot.nick || slot.Name;
    const item = slot.item || '';
    const ability = slot.ability || '';
    const level = slot.level || 50;
    const nature = slot.nature || 'Hardy';
    const ivs = slot.ivs || { hp:31, atk:31, def:31, spa:31, spd:31, spe:31 };
    const evs = slot.evs || { hp:0, atk:0, def:0, spa:0, spd:0, spe:0 };
    const moves = slot.moves || [];

    output += `${name}`;
    if (item) output += ` @ ${item}`;
    output += '\n';
    if (ability) output += `Ability: ${ability}\n`;
    output += `Level: ${level}\n`;
    const evStr = ['HP','Atk','Def','SpA','SpD','Spe'].map((s, i) => {
      const val = evs[['hp','atk','def','spa','spd','spe'][i]];
      return val ? `${val} ${s}` : null;
    }).filter(Boolean).join(' / ') || '0 HP';
    output += `EVs: ${evStr}\n`;
    output += `${nature} Nature\n`;
    const ivStr = ['HP','Atk','Def','SpA','SpD','Spe'].map((s, i) => {
      const val = ivs[['hp','atk','def','spa','spd','spe'][i]];
      return `${val} ${s}`;
    }).join(' / ');
    output += `IVs: ${ivStr}\n`;
    moves.forEach(move => {
      output += `- ${move}\n`;
    });
    output += '\n';
  });
  return output.trim();
}

function exportAsPBS(team) {
  let output = '[TEAM]\n\n';
  team.forEach(slot => {
    if (!slot) return;
    const name = slot.nick || slot.Name;
    const item = slot.item || '';
    const ability = slot.ability || '';
    const level = slot.level || 50;
    const nature = slot.nature || 'Hardy';
    const ivs = slot.ivs || { hp:31, atk:31, def:31, spa:31, spd:31, spe:31 };
    const evs = slot.evs || { hp:0, atk:0, def:0, spa:0, spd:0, spe:0 };
    const moves = slot.moves || [];
    const form = slot.form !== null && slot.form !== undefined ? slot.form : '';

    output += `Pokemon = ${name},${level}\n`;
    moves.forEach(move => {
      output += `Moves = ${move}\n`;
    });
    if (ability) output += `Ability = ${ability}\n`;
    output += `Nature = ${nature}\n`;
    if (item) output += `Item = ${item}\n`;
    const ivStr = [ivs.hp, ivs.atk, ivs.def, ivs.spe, ivs.spa, ivs.spd].join(',');
    output += `IV = ${ivStr}\n`;
    const evStr = [evs.hp, evs.atk, evs.def, evs.spe, evs.spa, evs.spd].join(',');
    output += `EV = ${evStr}\n`;
    output += `\n`;
  });
  return output.trim();
}

function exportTeam() {
  const format = document.getElementById('export-format').value;
  let data;
  if (format === 'json') {
    data = JSON.stringify(currentTeam, null, 2);
  } else if (format === 'pokepaste') {
    data = exportAsPokepaste(currentTeam);
  } else if (format === 'pbs') {
    data = exportAsPBS(currentTeam);
  } else {
    data = JSON.stringify(currentTeam, null, 2);
  }
  const blob = new Blob([data], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `team_${game}.${format === 'json' ? 'json' : 'txt'}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importTeamFromFile(e) {
  const f = e.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const t = JSON.parse(ev.target.result);
      if (Array.isArray(t) && t.length === 6) {
        currentTeam = t;
        refreshTeamUI();
        saveTeam(true);
        showStatus('Team imported and saved');
      } else { showStatus('Invalid team file'); }
    } catch (err) { showStatus('Error parsing file'); }
  };
  reader.readAsText(f);
} 

init();
