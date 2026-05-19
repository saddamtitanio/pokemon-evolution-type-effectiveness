import { NextRequest, NextResponse } from 'next/server';
import { driver } from '@/src/lib/neo4j';

type Params = { params: Promise<{ name: string }> };

// Route: /api/evolution/[name]
export async function GET(
    request: NextRequest,
    { params }: Params
)  {

    // Get pokemon name from params
    const { name } = await params;

    // Create Neo4j session
    const session = driver.session();

    try {

        // Query to fetch the full evolution chain
        const result = await session.run(
        `
        // Find the base pokemon in the evolution chain (pokemon that nothing evolves into)
        MATCH (base:Pokemon)

        WHERE NOT (:Pokemon)-[:EVOLVES_TO]->(base)

            // Check if:
            // The base Pokemon itself matches the searched name or
            // The searched Pokemon exists somewhere in the chain
            AND (
                base.name = $name
                OR (base)-[:EVOLVES_TO*]->(:Pokemon {name: $name})
            )

        // Get the full evolution path from the base Pokemon
        MATCH path = (base)-[:EVOLVES_TO*0..]->(member:Pokemon)

        // Collect all poemon nodes in the chain
        WITH collect(DISTINCT {

            // Pokemon name
            name: member.name,

            // Pokemon ID number
            id: member.id,

            // Pokemon types
            types: member.types

        }) AS nodes,

        // Collect evolution relationships between pokemon
        collect(DISTINCT {

            // Starting Pokemon in the evolution
            from: startNode(last(relationships(path))).name,

            // Evolved Pokemon
            to: endNode(last(relationships(path))).name,

            // Evolution level in the chain
            level: length(path)

        }) AS edges

        RETURN nodes, edges
        `,
        { name }
        );

        // If no evolution data is found, return 404 error
        if (result.records.length === 0) {
            return NextResponse.json(
                { error: `No evolution data found for "${name}"` },
                { status: 404 }
            );
        }

        // Get first query result
        const record = result.records[0];

        // Extract Pokemon nodes from the query result
        const nodes: { name: string; id: number; types: string[] }[] = record.get("nodes");

        // Extract evolution edges from query result
        // Also remove invalid edges from paths with no evolution
        // for example: Bulbasaur -> Bulbasaur
        const edges: { from: string; to: string; level: number }[] = 
            record
            .get("edges")
            .filter((e: { from: string; to: string }) => e.from && e.to);

        // Return JSON response
        return NextResponse.json({
            pokemon: name,
            
            evolutionChain: {
                nodes,
                edges,
            },
        });

    } catch (error) {
        console.error("Neo4j evolution query error:", error);

        return NextResponse.json(
            { error: "Failed to fetch evolution data" },
            { status: 500 }
        );

    } finally {
        await session.close();
    }
}