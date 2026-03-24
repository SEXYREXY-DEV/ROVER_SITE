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

