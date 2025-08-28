export function normalizePokemon(pokemon) {
  const levelUpMoves = [];
  if (Array.isArray(pokemon.Moves)) {
    for (let i = 1; i < pokemon.Moves.length; i += 2) {
      levelUpMoves.push(pokemon.Moves[i]);
    }
  }

  const tutorMoves = Array.isArray(pokemon.TutorMoves) ? pokemon.TutorMoves : [];

  const eggMoves = (pokemon.EggMoves || '').split(',').map(m => m.trim()).filter(Boolean);

  const allMoves = [...new Set([...levelUpMoves, ...tutorMoves, ...eggMoves])];

  const abilities = (pokemon.Abilities || '').split(',').map(a => a.trim());
  const hiddenAbilities = (pokemon.HiddenAbilities || pokemon.HiddenAbility || '').split(',').map(a => a.trim());
  const allAbilities = [...new Set([...abilities, ...hiddenAbilities])];


  const forms = (pokemon.Forms || []).map(form => ({
    name: form.FormName || '',
    types: [form.Type1, form.Type2].filter(Boolean),
    abilities: (form.Abilities || '').split(',').map(a => a.trim()),

  }));

  return {
    InternalName: (pokemon.InternalName || '').toLowerCase(),
    Name: (pokemon.Name || '').toLowerCase(),
    Types: [(pokemon.Type1 || '').toLowerCase(), (pokemon.Type2 || '').toLowerCase()].filter(Boolean),
    Abilities: allAbilities.map(a => a.toLowerCase()),
    Moves: allMoves.map(m => m.toLowerCase()),
    EggGroups: (pokemon.EggGroups || '').toLowerCase().split(',').map(g => g.trim()).filter(Boolean),
    Forms: forms.map(f => ({
      name: f.name.toLowerCase(),
      types: f.types.map(t => t.toLowerCase()),
      abilities: f.abilities.map(a => a.toLowerCase())
    })),
  };
}

export function findMatchingOriginal(n, list) {
  return list.find(p =>
    p.InternalName.toLowerCase() === n.InternalName &&
    p.Name.toLowerCase() === n.Name
  );
}

export function applyFilters() {
  const nameQuery = document.getElementById('name-search').value.toLowerCase().trim();
  const typeQuery = document.getElementById('type-search').value.toLowerCase().trim();
  const abilityQuery = document.getElementById('ability-search').value.toLowerCase().trim();
  const moveQuery = document.getElementById('move-search').value.toLowerCase().trim();

  const filtered = normalizedList.filter(p => {
    const nameMatch =
      !nameQuery ||
      p.Name.includes(nameQuery) ||
      (p.Forms || []).some(f => f.name.includes(nameQuery));

    const typeMatch =
      !typeQuery ||
      (p.Types || []).some(t => t.includes(typeQuery)) ||
      (p.Forms || []).some(f =>
        (f.types || []).some(t => t.includes(typeQuery))
      );

    const abilityMatch =
      !abilityQuery ||
      (p.Abilities || []).some(a => a.includes(abilityQuery)) ||
      (p.Forms || []).some(f =>
        (f.abilities || []).some(a => a.includes(abilityQuery))
      );

    const moveMatch =
      !moveQuery ||
      (p.Moves || []).some(m => m.includes(moveQuery));

    return nameMatch && typeMatch && abilityMatch && moveMatch;
  });

  const matchingOriginal = filtered.map(n => findMatchingOriginal(n, pokemons));
  pokedexContainer.innerHTML = '';
  matchingOriginal.filter(p => p).forEach(p => renderPokemonCard(p));
}

