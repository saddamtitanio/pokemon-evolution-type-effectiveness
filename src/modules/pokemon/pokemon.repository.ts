import connectDB from "@/src/lib/mongodb";
import Pokemon, { IPokemon } from "./pokemon.model";
import { driver } from "@/src/lib/neo4j";

export class PokemonRepository {
    static async findPokemonBySlug(slug: string): Promise<IPokemon | null> {
        await connectDB();
        return await Pokemon.findOne({ slug });
    };

    static async findAllPokemon(): Promise<IPokemon[]> {
        await connectDB();
        return await Pokemon.find();
    };

    static async getTypeDataAndWeaknesses(pokemonId: number) {
        const session = driver.session();
        try {
            const result = await session.run(
                `
                MATCH (p:Pokemon {id: $id})-[:HAS_TYPE]->(t:Type)
                WITH p, collect(t.name) AS pTypes
                
                MATCH (a:Type)
                UNWIND pTypes AS tName
                MATCH (t:Type {name: tName})
                
                OPTIONAL MATCH (a)-[s:STRONG_AGAINST]->(t)
                OPTIONAL MATCH (a)-[w:WEAK_AGAINST]->(t)
                OPTIONAL MATCH (a)-[i:NO_EFFECT_ON]->(t)
                
                WITH pTypes, a.name AS attackingType,
                     collect(
                       case
                         when i IS NOT NULL then 0.0
                         when s IS NOT NULL then 2.0
                         when w IS NOT NULL then 0.5
                         else 1.0
                       end
                     ) AS multipliers
                     
                WITH pTypes, attackingType,
                     reduce(p = 1.0, m IN multipliers | p * m) AS netMultiplier
                     
                WHERE netMultiplier > 1.0
                RETURN pTypes AS types, collect(attackingType) AS weaknesses
                `,
                { id: pokemonId }
            );

            if (result.records.length === 0) {
                const typesResult = await session.run(
                    `
                    MATCH (p:Pokemon {id: $id})-[:HAS_TYPE]->(t:Type)
                    RETURN collect(t.name) AS types
                    `,
                    { id: pokemonId }
                );
                const types = typesResult.records.length > 0 ? typesResult.records[0].get("types") : [];
                return {
                    types: types.map((t: string) => t.charAt(0).toUpperCase() + t.slice(1)),
                    weaknesses: []
                };
            }

            const record = result.records[0];
            const rawTypes: string[] = record.get("types") || [];
            const rawWeaknesses: string[] = record.get("weaknesses") || [];

            return {
                types: rawTypes.map((t: string) => t.charAt(0).toUpperCase() + t.slice(1)),
                weaknesses: rawWeaknesses.map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            };
        } finally {
            await session.close();
        }
    }

    static async getTypeDataForAllPokemon(): Promise<Record<number, string[]>> {
        const session = driver.session();
        try {
            const result = await session.run(
                `
                MATCH (p:Pokemon)-[:HAS_TYPE]->(t:Type)
                RETURN p.id AS id, collect(t.name) AS types
                `
            );
            const typeMap: Record<number, string[]> = {};
            result.records.forEach(r => {
                const id = Number(r.get("id"));
                const types = r.get("types") || [];
                typeMap[id] = types.map((t: string) => t.charAt(0).toUpperCase() + t.slice(1));
            });
            return typeMap;
        } finally {
            await session.close();
        }
    }
}
