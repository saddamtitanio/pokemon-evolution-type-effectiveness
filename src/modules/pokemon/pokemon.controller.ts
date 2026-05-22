import { PokemonService } from "./pokemon.service";

export class PokemonController {
    static async getPokemon(slugParam: string): Promise<Response> {
        try {
            if (!slugParam) {
                return Response.json({ error: "Missing identity parameter" }, { status: 400 });
            }

            const completePokemon = await PokemonService.findPokemonBySlug(slugParam);
            if (!completePokemon) {
                return Response.json({ error: "Pokémon not found" }, { status: 404 });
            }

            return Response.json(completePokemon, { status: 200 });
        
        } catch (error: any) {
            return Response.json({ error: error.message }, { status: 500 });
        }
    }

    static async getAllPokemon(): Promise<Response> {
        try {
            const allPokemon = await PokemonService.findAllPokemon();

            return Response.json(allPokemon, { status: 200 });
        } catch (error: any) {
            return Response.json({ error: error.message }, { status: 500 });
        }
    }


}