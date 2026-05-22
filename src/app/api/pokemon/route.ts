import { PokemonController } from "@/src/modules/pokemon/pokemon.controller";

export async function GET() {
    return await PokemonController.getAllPokemon();
}