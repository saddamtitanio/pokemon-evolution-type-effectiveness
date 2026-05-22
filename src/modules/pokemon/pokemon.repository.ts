import connectDB from "@/src/lib/mongodb";
import Pokemon, { IPokemon } from "./pokemon.model";
// import { runCypherQuery } from "@/src/lib/neo4j";

export class PokemonRepository {
    static async findPokemonBySlug(slug: string): Promise<IPokemon | null> {
        await connectDB();
        return await Pokemon.findOne({ slug });
    };

    static async findAllPokemon(): Promise<IPokemon[]> {
        await connectDB();
        return await Pokemon.find();
    };

    // SHOULD BE HANDLED BY NEO4J
    static async getTypeDataAndWeaknesses(slug: string) {
        return {
        types: ["Grass", "Poison"],
        weaknesses: ["Fire", "Flying", "Ice", "Psychic"]
        };
    }

    // SHOULD BE HANDLED BY NEO4J
    static async getTypeDataForAllPokemon(): Promise<Record<string, string[]>> {
        return {
            "bulbasaur": ["Grass", "Poison"],
            "ivysaur": ["Grass", "Poison"],
            "charmander": ["Fire"],
            "nidoran-female": ["Poison"]
        }
    }

}
