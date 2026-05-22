import { NextRequest, NextResponse } from "next/server";
import { driver } from "@/src/lib/neo4j";

// Generate simple unique ID
function generateId() {
  return "team_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now();
}

// Route: GET /api/team-builder - Fetch all saved teams
export async function GET() {
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (t:Team)
      OPTIONAL MATCH (t)-[:HAS_POKEMON]->(p:Pokemon)
      WITH t, p, [ (p)-[:HAS_TYPE]->(tp:Type) | tp.name ] AS types
      ORDER BY p.id
      WITH t, collect(CASE WHEN p IS NULL THEN null ELSE {
        id: p.id,
        name: p.name,
        image: p.image,
        types: types
      } END) AS pokemonRaw
      RETURN t.id AS id, t.name AS name, [x IN pokemonRaw WHERE x IS NOT NULL] AS pokemon
      `
    );

    const teams = result.records.map((record) => {
      const id = record.get("id");
      const name = record.get("name");
      const pokemon = record.get("pokemon") || [];

      // Capitalize types for display
      const formattedPokemon = pokemon.map((p: any) => ({
        ...p,
        types: (p.types || []).map((t: string) => t.charAt(0).toUpperCase() + t.slice(1))
      }));

      return { id, name, pokemon: formattedPokemon };
    });

    return NextResponse.json(teams, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching teams from Neo4j:", error);
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  } finally {
    await session.close();
  }
}

// Route: POST /api/team-builder - Create a new team
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, pokemon } = body; // pokemon is an array of pokemon names (strings)

  if (!name || typeof name !== "string" || name.trim() === "") {
    return NextResponse.json({ error: "Team name is required" }, { status: 400 });
  }

  if (!Array.isArray(pokemon) || pokemon.length === 0) {
    return NextResponse.json({ error: "Team must contain at least 1 Pokemon" }, { status: 400 });
  }

  if (pokemon.length > 6) {
    return NextResponse.json({ error: "Team cannot exceed 6 Pokemon" }, { status: 400 });
  }

  // Check for duplicates
  const uniqueNames = new Set(pokemon.map((p: string) => p.toLowerCase().trim()));
  if (uniqueNames.size !== pokemon.length) {
    return NextResponse.json({ error: "Team cannot contain duplicate Pokemon" }, { status: 400 });
  }

  const session = driver.session();

  try {
    // 1. Verify all Pokémon exist in Neo4j
    const verifyResult = await session.run(
      `
      MATCH (p:Pokemon)
      WHERE toLower(p.name) IN [name IN $pokemon | toLower(trim(name))]
      RETURN collect(p.name) AS found
      `,
      { pokemon }
    );

    const foundNames = verifyResult.records[0].get("found") || [];
    const foundSet = new Set(foundNames.map((n: string) => n.toLowerCase()));

    const missingPokemon = pokemon.filter((name: string) => !foundSet.has(name.toLowerCase().trim()));
    if (missingPokemon.length > 0) {
      return NextResponse.json(
        { error: `The following Pokémon do not exist in the database: ${missingPokemon.join(", ")}` },
        { status: 400 }
      );
    }

    // 2. Create the Team and relationships
    const teamId = generateId();

    await session.run(
      `
      CREATE (t:Team {id: $teamId, name: $name})
      WITH t
      UNWIND $pokemon AS pokemonName
      MATCH (p:Pokemon)
      WHERE toLower(p.name) = toLower(trim(pokemonName))
      CREATE (t)-[:HAS_POKEMON]->(p)
      `,
      { teamId, name: name.trim(), pokemon }
    );

    return NextResponse.json({ success: true, teamId }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating team in Neo4j:", error);
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
  } finally {
    await session.close();
  }
}
