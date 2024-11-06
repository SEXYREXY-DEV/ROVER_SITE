export async function fetchPokemonData() {
    try {
        const response = await fetch('pokemon.json');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch Pokémon data:', error);
        return []; // Return an empty array or handle it as you see fit
    }
}
