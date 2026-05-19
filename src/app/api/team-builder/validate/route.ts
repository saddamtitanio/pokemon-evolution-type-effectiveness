import { NextRequest, NextResponse } from 'next/server';
import { driver } from '@/src/lib/neo4j';

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { team } = body;

    if (!Array.isArray(team)) {
        return NextResponse.json(
            { error: 'Invalid team format' },
            { status: 400 }
        );
    }

    // Limit team size to 6 Pokemon
    if (team.length > 6) {
        return NextResponse.json(
            { valid: false, error: 'Team cannot exceed 6 Pokemon' },
            { status: 400 }
        );
    }

    // Track duplicates using a map (case-insensitive check)
    const seen = new Map<string, number>();

    const duplicates = team.filter((pokemon, index) => {
        const key = pokemon.toLowerCase();

        // First time seeing this Pokémon
        if (!seen.has(key)) {
            seen.set(key, index);
            return false;
        }

        // Already seen -> mark as duplicate
        return true;
    });

    // Remove repeated duplicate entries
    const uniqueDuplicates = [...new Set(duplicates)];

    // Open Neo4j session
    const session = driver.session();

    try {
        // Find which Pokemon actually exist in the database
        const pokemonResult = await session.run(
            `
            MATCH (p:Pokemon)
            WHERE toLower(p.name) IN [name IN $team | toLower(name)]
            RETURN collect(p.name) AS foundPokemon
            `,
            { team }
        );

        const foundPokemon = pokemonResult.records[0].get('foundPokemon');

        // Convert found Pokemon into a lookup set
        const foundSet = new Set(
            foundPokemon.map((p: string) => p.toLowerCase())
        );

        // Find Pokemon names that don't exist in DB
        const invalidPokemon = team.filter(
            (pokemon: string) => !foundSet.has(pokemon.toLowerCase())
        );

        // Check team weaknesses based on type relationships in Neo4j
        const weaknessResult = await session.run(
        `
            MATCH (p:Pokemon)-[:HAS_TYPE]->(t:Type)
            WHERE toLower(p.name) IN [name IN $team | toLower(name)]

            MATCH (t)-[:WEAK_AGAINST]->(weakness:Type)

            RETURN weakness.name AS type,
                    count(*) AS weaknessCount
            ORDER BY weaknessCount DESC
            `,
            { team }
        );

        const weaknesses = weaknessResult.records.map((record) => {
        const count = Number(record.get('weaknessCount'));

        return {
            type: record.get('type'),
            count,
            severity:
            count >= 3
                ? 'danger'
                : count >= 2
                ? 'warning'
                : 'minor',
        };
        });

        return NextResponse.json({
            valid: uniqueDuplicates.length === 0 && invalidPokemon.length === 0,
            teamSize: team.length,
            duplicates: uniqueDuplicates,
            invalidPokemon,
            weaknesses,
        });
    } catch (error) {
        console.error('Builder validation error:', error);

        return NextResponse.json(
            { error: 'Validation failed' },
            { status: 500 }
        );
    } finally {
        await session.close();
    }
}