export function parseEvolutionTargets(evolutions) {
  const result = [];
  if (Array.isArray(evolutions)) {
    for (let i = 0; i < evolutions.length; i += 3) {
      result.push({
        target: evolutions[i],
        param: evolutions[i + 1],
        method: evolutions[i + 2]
      });
    }
  } else if (typeof evolutions === 'string' && evolutions.trim()) {
    const parts = evolutions.split(',').map(item => item.trim()).filter(Boolean);
    for (let i = 0; i < parts.length; i += 3) {
      result.push({
        target: parts[i],
        param: parts[i + 1],
        method: parts[i + 2]
      });
    }
  }
  return result;
}

export function buildEvolutionParentMap(pokemons) {
  const reverseMap = new Map();
  for (const pokemon of pokemons) {
    const targets = parseEvolutionTargets(pokemon.Evolutions);
    for (const evo of targets) {
      const target = (evo.target || '').toUpperCase();
      if (!target) continue;
      if (!reverseMap.has(target)) reverseMap.set(target, []);
      reverseMap.get(target).push((pokemon.InternalName || '').toUpperCase());
    }
  }
  return reverseMap;
}

export function extractEggMoves(pokemon) {
  if (Array.isArray(pokemon.EggMoves)) {
    return pokemon.EggMoves.map(m => m.trim()).filter(Boolean);
  }
  if (typeof pokemon.EggMoves === 'string') {
    return pokemon.EggMoves.split(',').map(m => m.trim()).filter(Boolean);
  }
  return [];
}

export function getInheritedEggMoves(pokemon, allPokemon) {
  const parentMap = buildEvolutionParentMap(allPokemon);
  const pokemonMap = new Map(allPokemon.map(p => [ (p.InternalName || '').toUpperCase(), p ]));
  const visited = new Set();
  const stack = [ (pokemon.InternalName || '').toUpperCase() ];
  const inherited = new Set();

  while (stack.length) {
    const current = stack.pop();
    const parents = parentMap.get(current) || [];
    for (const parent of parents) {
      if (visited.has(parent)) continue;
      visited.add(parent);
      const parentPokemon = pokemonMap.get(parent);
      if (!parentPokemon) continue;
      extractEggMoves(parentPokemon).forEach(move => inherited.add(move));
      stack.push(parent);
    }
  }

  return [...inherited];
}

export function normalizePokemon(pokemon, extraEggMoves = []) {
  const levelUpMoves = [];
  if (Array.isArray(pokemon.Moves)) {
    for (let i = 1; i < pokemon.Moves.length; i += 2) {
      levelUpMoves.push(pokemon.Moves[i]);
    }
  }

  const items = [
  pokemon.WildItemCommon,
  pokemon.WildItemUncommon,
  pokemon.WildItemRare
  ].filter(Boolean);

  const tutorMoves = Array.isArray(pokemon.TutorMoves) ? pokemon.TutorMoves : [];

  const eggMoves = extractEggMoves(pokemon);
  const extraMoves = [];
  const additional = Array.isArray(extraEggMoves) ? extraEggMoves : [extraEggMoves];
  additional.forEach(move => {
    if (!move && move !== 0) return;
    if (typeof move === 'string') {
      move.split(',').map(m => m.trim()).filter(Boolean).forEach(m => extraMoves.push(m));
    } else {
      extraMoves.push(String(move).trim());
    }
  });

  const allEggMoves = [...new Set([...eggMoves, ...extraMoves])];
  const allMoves = [...new Set([...levelUpMoves, ...tutorMoves, ...allEggMoves])];

  const abilities = (pokemon.Abilities || '').split(',').map(a => a.trim());
  const hiddenAbilities = (pokemon.HiddenAbilities || pokemon.HiddenAbility || '').split(',').map(a => a.trim());
  const allAbilities = [...new Set([...abilities, ...hiddenAbilities])];


  const forms = (pokemon.Forms || []).map(form => ({
    name: form.FormName || '',
    types: [form.Type1, form.Type2].filter(Boolean),
    abilities: (form.Abilities || '').split(',').map(a => a.trim()),

  }));

  const evolves = Array.isArray(pokemon.Evolutions)
    ? pokemon.Evolutions.length > 0
    : typeof pokemon.Evolutions === 'string'
      ? pokemon.Evolutions.trim().length > 0
      : false;

  return {
    InternalName: (pokemon.InternalName || '').toLowerCase(),
    Name: (pokemon.Name || '').toLowerCase(),
    Types: [(pokemon.Type1 || '').toLowerCase(), (pokemon.Type2 || '').toLowerCase()].filter(Boolean),
    Abilities: allAbilities.map(a => a.toLowerCase()),
    Moves: allMoves.map(m => m.toLowerCase()),
    EggGroups: (pokemon.EggGroups || '').toLowerCase().split(',').map(g => g.trim()).filter(Boolean),
    Items: items ? items.map(i => i.toLowerCase()) : [],
    Forms: forms.map(f => ({
      name: f.name.toLowerCase(),
      types: f.types.map(t => t.toLowerCase()),
      abilities: f.abilities.map(a => a.toLowerCase())
    })),
    Evolves: evolves
  };
}

export function findMatchingOriginal(n, list) {
  return list.find(p =>
    p.InternalName.toLowerCase() === n.InternalName &&
    p.Name.toLowerCase() === n.Name
  );
}

