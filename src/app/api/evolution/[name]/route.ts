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
        MATCH (base:Pokemon)

        WHERE NOT (:Pokemon)-[:EVOLVES_TO]->(base)
            AND (
            toLower(base.name) = toLower($name)
            OR (base)-[:EVOLVES_TO*]->(:Pokemon {name: $name})
            )

        MATCH path = (base)-[:EVOLVES_TO*0..]->(member:Pokemon)

        WITH
            collect(DISTINCT {
            id: member.id,
            name: member.name,
            image: member.image,
            species: member.species
            }) AS nodes,

            [
            p IN collect(path)
            WHERE length(p) > 0
            | {
                from: startNode(last(relationships(p))).id,
                to: endNode(last(relationships(p))).id,
                level: length(p)
                }
            ] AS edges

        RETURN nodes, edges
        `,
        { name: name.toLowerCase() }
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
