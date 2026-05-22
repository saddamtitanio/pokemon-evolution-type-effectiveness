import { PokemonRepository } from "./pokemon.repository";

export class PokemonService {
    static async findPokemonBySlug(slugParam: string) {
        const exactSlug = slugParam.toLowerCase();

        const mongoData = await PokemonRepository.findPokemonBySlug(exactSlug);
        if (!mongoData) return null;

        const graphData = await PokemonRepository.getTypeDataAndWeaknesses(mongoData.id);

        return {
            id: mongoData.id,
            slug: mongoData.slug,
            name: mongoData.name,
            description: mongoData.description,
            category: mongoData.category,
            height: mongoData.height,
            weight: mongoData.weight,
            gender: mongoData.gender,
            stats: mongoData.stats,
            imageUrl: mongoData.imageUrl,
            types: graphData.types,
            weaknesses: graphData.weaknesses
        };
    }

    static async findAllPokemon() {
        const [mongoData, graphData] = await Promise.all([
            PokemonRepository.findAllPokemon(),
            PokemonRepository.getTypeDataForAllPokemon()
        ]);

        return mongoData.map(pokemon => ({
            id: pokemon.id,
            slug: pokemon.slug,
            name: pokemon.name,
            imageUrl: pokemon.imageUrl,
            types: graphData[pokemon.id] || [] 
        }));
    }
}