import { PokemonController } from '@/src/modules/pokemon/pokemon.controller';

interface RouteParams {
    params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
    const resolvedParams = await params;
    
    return await PokemonController.getPokemon(resolvedParams.slug);
}