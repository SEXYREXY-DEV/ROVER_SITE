const params = new URLSearchParams(window.location.search);
const game = params.get('game');
const notice = document.getElementById('notice');
const pokedexWrapper = document.getElementById('pokedex-wrapper');
import { normalizePokemon, findMatchingOriginal, applyFilters } from './utils.js';
if (game) {
  loadPokedex(game, pokedexWrapper);
} else {
  notice.innerHTML = '<p>Error: No game selected.</p>';
}


let normalizedList = [];

let config = { excludedPokemon: [], AllowsForms: "Y" };

async function loadPokedex(game, container = document.getElementById('pokedex-container')) {
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

  try {
    const configResp = await fetch(`./games/${game}/data/config.json`);
    if (configResp.ok) {
      config = await configResp.json();
    }
  } catch (e) {

    config = { excludedPokemon: [], AllowsForms: "Y" };
  }

  try {
    const response = await fetch(`./games/${game}/data/pokemon_master_evo.json`);
    console.log('Fetch response:', response);
    const pokemons = await response.json();
    console.log('Pokemons data:', pokemons);

    normalizedList = pokemons.map(p => normalizePokemon(p));
    console.log('Normalized list:', normalizedList);

    if (Array.isArray(config.excludedPokemon) && config.excludedPokemon.length > 0) {
      const excludedSet = new Set(config.excludedPokemon.map(name => name.toUpperCase()));
      normalizedList = normalizedList.filter(
        p => !excludedSet.has(p.InternalName.toUpperCase())
      );

      normalizedList.forEach(p => {
        if (Array.isArray(p.Forms)) {
          p.Forms = p.Forms.filter(
            f =>
              !excludedSet.has((f.InternalName || '').toUpperCase()) &&
              !excludedSet.has((f.FormName || '').toUpperCase())
          );
        }
      });
    }

    if (config.AllowsForms === "N") {
      normalizedList.forEach(p => { p.Forms = []; });
    }

    const tNames = new Set(
      normalizedList
        .map(p => p.InternalName)
        .filter(name => name.endsWith('t'))
        .map(name => name.slice(0, -1))
    );

    normalizedList = normalizedList.filter(p =>
      !(tNames.has(p.InternalName) && !p.InternalName.endsWith('t'))
    );
    
    function renderFilteredResults(filteredList, originalData) {
      const sortSelect = document.getElementById('sort-select');
      const sortBy = sortSelect ? sortSelect.value : 'alphabetical';
      const sortedList = sortPokemonList(filteredList, sortBy);

      container.innerHTML = '';
      const matchingOriginal = sortedList.map(n => {
        const found = originalData.find(p => p.InternalName.toLowerCase() === n.InternalName);
        if (!found) {
          console.warn('No match for:', n.InternalName);
        }
        return found;
      });

      matchingOriginal.filter(p => p).forEach(p => renderPokemonCard(p));
    }
    
    renderFilteredResults(normalizedList, pokemons);

    document.getElementById('search-bar').addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();

      let filtered;
      if (!query) {
        filtered = normalizedList;
      } else {
        filtered = normalizedList.filter(p =>
          p.Name.includes(query) ||
          (p.Types || []).some(t => t.includes(query)) ||
          (p.Abilities || []).some(a => a.includes(query)) ||
          (p.EggGroups || []).some(g => g.includes(query)) ||
          (p.Forms || []).some(f =>
            f.name.includes(query) ||
            (f.types || []).some(t => t.includes(query)) ||
            (f.abilities || []).some(a => a.includes(query))
          )
        );
      }

      container.innerHTML = '';
      const matchingOriginal = filtered.map(n => findMatchingOriginal(n, pokemons));

      matchingOriginal.filter(p => p).forEach(p => renderPokemonCard(p));
    });

    ['name-search', 'type-search', 'ability-search', 'move-search'].forEach(id => {
      document.getElementById(id).addEventListener('input', applyFilters);
    });

    document.getElementById('name-search').addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();

      let filtered;
      if (!query) {

        filtered = normalizedList;
      } else {
        filtered = normalizedList.filter(p =>
          p.Name.includes(query) ||
          (p.Forms || []).some(f => f.name.includes(query))
        );
      }

      container.innerHTML = '';
      const matchingOriginal = filtered.map(n => findMatchingOriginal(n, pokemons));

      matchingOriginal.filter(p => p).forEach(p => renderPokemonCard(p));
    });

    document.getElementById('type-search').addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();

      let filtered;
      if (!query) {
        // Show all Pokémon if search input is empty
        filtered = normalizedList;
      } else {
        filtered = normalizedList.filter(p =>
          (p.Types || []).some(t => t.includes(query)) ||
          (p.Forms || []).some(f =>
            (f.types || []).some(t => t.includes(query))
          )
        );
      }

      container.innerHTML = '';
      const matchingOriginal = filtered.map(n => findMatchingOriginal(n, pokemons)
      );
      matchingOriginal.filter(p => p).forEach(p => renderPokemonCard(p));
    });

    document.getElementById('ability-search').addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();

      let filtered;
      if (!query) {
        // Show all Pokémon if search input is empty
        filtered = normalizedList;
      } else {
        filtered = normalizedList.filter(p =>
          (p.Abilities || []).some(a => a.includes(query)) ||
          (p.Forms || []).some(f =>
            (f.abilities || []).some(a => a.includes(query))
          )
        );
      }

      container.innerHTML = '';
      const matchingOriginal = filtered.map(n => findMatchingOriginal(n, pokemons)
      );
      matchingOriginal.filter(p => p).forEach(p => renderPokemonCard(p));
    });

    document.getElementById('move-search').addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();

      let filtered;
      if (!query) {
        // Show all Pokémon if search input is empty
        filtered = normalizedList;
      } else {
        filtered = normalizedList.filter(p =>
          (p.Moves || []).some(m => m.includes(query)) ||
          (p.Forms || []).some(f =>
            (f.moves || []).some(m => m.includes(query))
          )
        );
      }

      container.innerHTML = '';
      const matchingOriginal = filtered.map(n => findMatchingOriginal(n, pokemons)
      );
      matchingOriginal.filter(p => p).forEach(p => renderPokemonCard(p));
    });

    document.getElementById('reset-button').addEventListener('click', () => {
      document.getElementById('search-bar').value = '';
      document.getElementById('name-search').value = '';
      document.getElementById('type-search').value = '';
      document.getElementById('ability-search').value = '';
      document.getElementById('move-search').value = '';
      renderFilteredResults(normalizedList, pokemons);
    });

    document.getElementById('sort-select').addEventListener('change', () => {
      renderFilteredResults(normalizedList, pokemons);
    });

    function renderPokemonCard(pokemon) {
      const card = document.createElement('div');
      card.className = 'pokemon-card';
      const mainInfo = document.createElement('div');
      mainInfo.className = 'main-info';
      const type1Color = getTypeColor(pokemon.Type1);
      const type2Color = pokemon.Type2 ? getTypeColor(pokemon.Type2) : null;
      
      card.addEventListener('click', () => {
        localStorage.setItem('selectedPokemon', pokemon.InternalName);
        window.location.href = `details.html?game=${game}`;
      });



      if (type2Color) {
        card.style.borderImage = `linear-gradient(to top, ${type2Color}, ${type1Color}) 1`;
        card.style.borderStyle = 'solid';
        card.style.borderWidth = '5px';

        card.addEventListener('mouseenter', () => {
          card.style.boxShadow = `0 6px 12px ${type2Color}, 0 6px 12px ${type1Color}`;
          card.style.transform = 'scale(1.05)';
        });
        card.addEventListener('mouseleave', () => {
          card.style.boxShadow = '';
          card.style.transform = '';
        });
      } else {
        card.style.border = `5px solid ${type1Color}`;

        card.addEventListener('mouseenter', () => {
          card.style.boxShadow = `0 6px 12px ${type1Color}`;
          card.style.transform = 'scale(1.05)';
        });
        card.addEventListener('mouseleave', () => {
          card.style.boxShadow = '';
          card.style.transform = '';
        });
      }

      const image = document.createElement('img');
      image.src = `./games/${game}/images/Front/${pokemon.InternalName}.png`;
      image.onerror = function () {
        this.onerror = null;
        this.src = `./games/${game}/images/Front/${pokemon.InternalName}T.png`; // Fallback image
      };
      image.alt = pokemon.Name;
      image.className = 'pokemon-image';

      const name = document.createElement('h2');
      name.textContent = pokemon.Name;

      const types = document.createElement('div');
      ['Type1', 'Type2'].forEach(typeKey => {
        if (pokemon[typeKey]) {
          const typeImg = document.createElement('img');
          typeImg.src = `./games/${game}/images/Types/${pokemon[typeKey]}.png`;
          typeImg.alt = pokemon[typeKey];
          typeImg.className = 'type-icon';
          types.appendChild(typeImg);
        }
      });

      const abilities = document.createElement('div');
      abilities.innerHTML = `<p><strong>Abilities:</strong> ${pokemon.Abilities}</p><p><strong>Hidden Ability:</strong> ${pokemon.HiddenAbilities || pokemon.HiddenAbility}</p>`;

      const statLabels = ['HP', 'Attack', 'Defense', 'Speed', 'Sp. Atk', 'Sp. Def'];
      const statDisplayOrder = [0, 1, 2, 4, 5, 3]; // Speed (index 3) last

      const statsList = document.createElement('ul');
      if (Array.isArray(pokemon.BaseStats)) {
        // Display in order: HP, Attack, Defense, Sp. Atk, Sp. Def, Speed (Speed last)
        [0, 1, 2, 4, 5, 3].forEach(idx => {
          const label = statLabels[idx];
          const li = document.createElement('li');
          li.textContent = `${label}: ${pokemon.BaseStats[idx]}`;
          statsList.appendChild(li);
        });
      }

      mainInfo.appendChild(image);
      mainInfo.appendChild(name);
      mainInfo.appendChild(types);
      mainInfo.appendChild(abilities);
      mainInfo.appendChild(statsList);

      card.appendChild(mainInfo);

      if (
        config.AllowsForms !== "N" &&
        pokemon.Forms &&
        pokemon.Forms.length > 0
      ) {
        const formsWrapper = document.createElement('div');
        formsWrapper.className = 'forms-wrapper';

        pokemon.Forms.forEach((form) => {
          const formCard = document.createElement('div');
          formCard.className = 'form-card';

          const formImage = document.createElement('img');
          const baseInternalName = (form.InternalName || pokemon.InternalName).replace(/T$/, '');
          let formIndex = pokemon.Forms.indexOf(form) + 1;

          let imgSrc = `./games/${game}/images/Front/${baseInternalName}.png`;
          formImage.src = imgSrc;
          formImage.alt = form.FormName;
          formImage.className = 'pokemon-image';

          // Recursive fallback logic
          formImage.onerror = function tryNext() {
            formIndex++;
            if (formIndex <= pokemon.Forms.length+1) {
              const nextSrc = `./games/${game}/images/Front/${baseInternalName}_${formIndex}.png`;
              this.onerror = tryNext;
              this.src = nextSrc;
            } else {
              this.onerror = null;
              this.src = `./games/${game}/images/Front/000.png`;
            }
          };

          const formTitle = document.createElement('h3');
          formTitle.textContent = form.FormName;

          const formTypes = document.createElement('div');
          ['Type1', 'Type2'].forEach(typeKey => {
            const typeValue = form[typeKey] || pokemon[typeKey];
            if (typeValue) {
              const formTypeImg = document.createElement('img');
              formTypeImg.src = `./games/${game}/images/Types/${typeValue}.png`;
              formTypeImg.alt = typeValue;
              formTypeImg.className = 'type-icon';
              formTypes.appendChild(formTypeImg);
            }
          });

          const formAbilities = document.createElement('div');
          formAbilities.innerHTML = `<p><strong>Abilities:</strong> ${form.Abilities}</p>`;
          formCard.appendChild(formAbilities);

          const formStats = document.createElement('ul');
          form.BaseStats.forEach((stat, idx) => {
            const li = document.createElement('li');
            li.textContent = `${statLabels[idx]}: ${stat}`;
            formStats.appendChild(li);
          });

          // Optional: color based on form's primary type
          const primaryType = form.Type1 || pokemon.Type1;
          const secondaryType = form.Type2 || pokemon.Type2;
          formCard.style.borderImage = `linear-gradient(to top, ${getTypeColor(secondaryType)}, ${getTypeColor(primaryType)}) 1`;

          formCard.style.borderStyle = 'solid';
          formCard.style.borderWidth = '3px';

          formCard.appendChild(formImage);
          formCard.appendChild(formTitle);
          formCard.appendChild(formTypes);
          formCard.appendChild(formAbilities);
          const formHiddenAbilityValue = form.HiddenAbilities || form.HiddenAbility;
          if (
            formHiddenAbilityValue &&
            !(form.Abilities || []).includes(formHiddenAbilityValue)
          ) {
            const formHiddenAbilities = document.createElement('div');
            formHiddenAbilities.innerHTML = `<p><strong>Hidden Ability:</strong> ${formHiddenAbilityValue}</p>`;
            formCard.appendChild(formHiddenAbilities);
          }
          formCard.appendChild(formStats);
          formsWrapper.appendChild(formCard);
        });

        card.appendChild(formsWrapper);
      }

      container.appendChild(card);
    }
  } catch (err) {
    container.innerHTML = `<p>Error loading data for game: ${game}</p>`;
    console.error(err);
  }
}

function sortPokemonList(list, sortBy) {

  if (sortBy === 'alphabetical') {
    return [...list].sort((a, b) => a.Name.localeCompare(b.Name));
  }
  // Default: return as-is (file order)
  return list;
}
