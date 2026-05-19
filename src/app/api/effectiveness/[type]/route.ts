import { driver } from '@/src/lib/neo4j';
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ type: string }> };

// Route: /api/effectiveness/[type]
export async function GET(
  request: NextRequest,
  { params }: Params
) {
    // Get the type name from the URL params
    const { type } = await params;

    // Create Neo4j session
    const session = driver.session();

    try {

        // Cypher query to get Pokemon type effectiveness data
        const result = await session.run(
            `
            // Find the selected Pokemon type node
            MATCH (t:Type {name: $type})

            // Offensive relationships
            // These describe how this type performs when attacking

            // Types this type is strong against
            OPTIONAL MATCH (t)-[:STRONG_AGAINST]->(strongAgainst:Type)

            // Types this type is weak against
            OPTIONAL MATCH (t)-[:WEAK_AGAINST]->(weakAgainst:Type)

            // Types this type has no effect on
            OPTIONAL MATCH (t)-[:NO_EFFECT_ON]->(noEffectOn:Type)

            // Defensive relationships
            // These describe how this type performs when being attacked

            // Types that are strong against this type
            OPTIONAL MATCH (weakTo:Type)-[:STRONG_AGAINST]->(t)

            // Types that this type resists
            OPTIONAL MATCH (resistedBy:Type)-[:WEAK_AGAINST]->(t)

            // Types that cannot affect this type
            OPTIONAL MATCH (immuneTo:Type)-[:NO_EFFECT_ON]->(t)

            // Return all collected relationship data
            RETURN
                t.name AS type,

                // Offensive data
                collect(DISTINCT strongAgainst.name) AS strongAgainst,
                collect(DISTINCT weakAgainst.name)   AS weakAgainst,
                collect(DISTINCT noEffectOn.name)    AS noEffectOn,

                // Defensive data
                collect(DISTINCT weakTo.name)        AS weakTo,
                collect(DISTINCT resistedBy.name)    AS resistedBy,
                collect(DISTINCT immuneTo.name)      AS immuneTo
            `,
            { type } // pass type into the query
        );

        // If no records were found, return 404 error
        if (result.records.length === 0) {
            return NextResponse.json(
                { error: `Type "${type}" not found` },
                { status: 404 }
            );
        }

        // Get the first result record
        const record = result.records[0];

        // Return JSON response
        return NextResponse.json({

            // Pokemon type name
            type: record.get("type"),

            // Offensive effectiveness
            offense: {

                // Strong attack matchups
                strongAgainst: record.get("strongAgainst").filter(Boolean),

                // Weak attack matchups
                weakAgainst: record.get("weakAgainst").filter(Boolean),

                // No effect attack matchups
                noEffectOn: record.get("noEffectOn").filter(Boolean),
            },

            // Defensive effectiveness
            defense: {

                // Types that deal strong damage to this type
                weakTo: record.get("weakTo").filter(Boolean),

                // Types this type resists
                resistedBy: record.get("resistedBy").filter(Boolean),

                // Types that cannot damage this type
                immuneTo: record.get("immuneTo").filter(Boolean),
            },
        });

    } catch (error) {
        console.error("Neo4j type effectiveness query error:", error);

        return NextResponse.json(
            { error: "Failed to fetch type effectiveness data" },
            { status: 500 }
        );

    } finally {
        await session.close();
    }
}