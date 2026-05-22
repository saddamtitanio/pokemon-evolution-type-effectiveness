import { NextRequest, NextResponse } from "next/server";
import { driver } from "@/src/lib/neo4j";

type Params = { params: Promise<{ id: string }> };

// Route: PUT /api/team-builder/[id] - Update a team
export async function PUT(
  request: NextRequest,
  { params }: Params
) {
  const { id } = await params;
  const body = await request.json();
  const { name, pokemon } = body; // pokemon is an array of names (strings)

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
    // 1. Verify the team exists
    const teamCheck = await session.run(
      `
      MATCH (t:Team {id: $id})
      RETURN t
      `,
      { id }
    );

    if (teamCheck.records.length === 0) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // 2. Verify all Pokémon exist in Neo4j
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

    // 3. Update team name and reset relationships
    await session.run(
      `
      MATCH (t:Team {id: $id})
      SET t.name = $name
      WITH t
      OPTIONAL MATCH (t)-[r:HAS_POKEMON]->()
      DELETE r
      WITH t
      UNWIND $pokemon AS pokemonName
      MATCH (p:Pokemon)
      WHERE toLower(p.name) = toLower(trim(pokemonName))
      CREATE (t)-[:HAS_POKEMON]->(p)
      `,
      { id, name: name.trim(), pokemon }
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating team in Neo4j:", error);
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
  } finally {
    await session.close();
  }
}

// Route: DELETE /api/team-builder/[id] - Delete a team
export async function DELETE(
  request: NextRequest,
  { params }: Params
) {
  const { id } = await params;
  const session = driver.session();

  try {
    // Verify team exists
    const teamCheck = await session.run(
      `
      MATCH (t:Team {id: $id})
      RETURN t
      `,
      { id }
    );

    if (teamCheck.records.length === 0) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Delete the team node and all its relationships
    await session.run(
      `
      MATCH (t:Team {id: $id})
      DETACH DELETE t
      `,
      { id }
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting team from Neo4j:", error);
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 });
  } finally {
    await session.close();
  }
}
