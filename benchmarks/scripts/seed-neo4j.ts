import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import { driver } from "../../src/lib/neo4j";

const session = driver.session();

const pokedex = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "benchmarks/scripts/data/pokedex.json"),
    "utf-8"
  )
);

async function seed() {
  const edges: { from: number; to: number }[] = [];

  // CREATE ALL POKEMON NODES
  for (const p of pokedex) {
    await session.run(
      `
      MERGE (pokemon:Pokemon {id: $id})
      SET
        pokemon.name = $name,
        pokemon.image = $image,
        pokemon.description = $description,
        pokemon.species = $species
      `,
      {
        id: p.id,
        name: p.name?.english?.toLowerCase(),
        image: p.image?.hires ?? null,
        description: p.description ?? null,
        species: p.species ?? null,
      }
    );
  }

  // BUILD EVOLUTION EDGES
  for (const p of pokedex) {
    if (!p.evolution?.next) continue;

    for (const evo of p.evolution.next) {
      const evoId = Number(evo[0]);

      if (!evoId) continue;

      edges.push({
        from: p.id,
        to: evoId,
      });
    }
  }

  // CREATE EVOLUTION RELATIONSHIPS
  await session.run(
    `
    UNWIND $edges AS edge
    MATCH (a:Pokemon {id: edge.from})
    MATCH (b:Pokemon {id: edge.to})
    MERGE (a)-[:EVOLVES_TO]->(b)
    `,
    { edges }
  );

  console.log("Neo4j evolution graph built");

  // TYPE GRAPH
  const TYPE_CHART = {
    fire: { strongAgainst: ["grass","ice","bug","steel"], weakAgainst: ["fire","water","rock","dragon"], noEffectOn: [] },
    water: { strongAgainst: ["fire","ground","rock"], weakAgainst: ["water","grass","dragon"], noEffectOn: [] },
    grass: { strongAgainst: ["water","ground","rock"], weakAgainst: ["fire","grass","poison","flying","bug","dragon","steel"], noEffectOn: [] },
    electric: { strongAgainst: ["water","flying"], weakAgainst: ["electric","grass","dragon"], noEffectOn: ["ground"] },
    ground: { strongAgainst: ["fire","electric","poison","rock","steel"], weakAgainst: ["grass","bug"], noEffectOn: ["flying"] },
    rock: { strongAgainst: ["fire","ice","flying","bug"], weakAgainst: ["fighting","ground","steel"], noEffectOn: [] },
    ice: { strongAgainst: ["grass","ground","flying","dragon"], weakAgainst: ["fire","water","ice","steel"], noEffectOn: [] },
    fighting: { strongAgainst: ["normal","ice","rock","dark","steel"], weakAgainst: ["poison","flying","psychic","bug","fairy"], noEffectOn: [] },
    poison: { strongAgainst: ["grass","fairy"], weakAgainst: ["poison","ground","rock","ghost"], noEffectOn: ["steel"] },
    flying: { strongAgainst: ["grass","fighting","bug"], weakAgainst: ["electric","rock","steel"], noEffectOn: [] },
    bug: { strongAgainst: ["grass","psychic","dark"], weakAgainst: ["fire","fighting","poison","flying","ghost","steel","fairy"], noEffectOn: [] },
    psychic: { strongAgainst: ["fighting","poison"], weakAgainst: ["psychic","steel"], noEffectOn: ["dark"] },
    ghost: { strongAgainst: ["psychic","ghost"], weakAgainst: ["dark"], noEffectOn: ["normal"] },
    dragon: { strongAgainst: ["dragon"], weakAgainst: ["steel"], noEffectOn: ["fairy"] },
    dark: { strongAgainst: ["psychic","ghost"], weakAgainst: ["fighting","dark","fairy"], noEffectOn: [] },
    steel: { strongAgainst: ["ice","rock","fairy"], weakAgainst: ["fire","water","electric","steel"], noEffectOn: [] },
    fairy: { strongAgainst: ["fighting","dragon","dark"], weakAgainst: ["fire","poison","steel"], noEffectOn: [] },
    normal: { strongAgainst: [], weakAgainst: ["rock","steel"], noEffectOn: ["ghost"] }
  };

  for (const [type, data] of Object.entries(TYPE_CHART)) {
    // CREATE TYPE NODE
    await session.run(
      `
      MERGE (t:Type {name: $type})
      `,
      { type }
    );

    // STRONG_AGAINST
    if (data.strongAgainst.length > 0) {
      await session.run(
        `
        MATCH (t:Type {name: $type})
        UNWIND $targets AS target
        MERGE (b:Type {name: target})
        MERGE (t)-[:STRONG_AGAINST]->(b)
        `,
        {
          type,
          targets: data.strongAgainst,
        }
      );
    }

    // WEAK_AGAINST
    if (data.weakAgainst.length > 0) {
      await session.run(
        `
        MATCH (t:Type {name: $type})
        UNWIND $targets AS target
        MERGE (b:Type {name: target})
        MERGE (t)-[:WEAK_AGAINST]->(b)
        `,
        {
          type,
          targets: data.weakAgainst,
        }
      );
    }

    // NO_EFFECT_ON
    if (data.noEffectOn.length > 0) {
      await session.run(
        `
        MATCH (t:Type {name: $type})
        UNWIND $targets AS target
        MERGE (b:Type {name: target})
        MERGE (t)-[:NO_EFFECT_ON]->(b)
        `,
        {
          type,
          targets: data.noEffectOn,
        }
      );
    }
  }

  console.log("Neo4j type graph built");

  const count = await session.run(`
    MATCH (n)
    RETURN count(n) AS total
  `);

  console.log(
    "Total nodes:",
    count.records[0].get("total").toNumber()
  );

  await session.close();
  await driver.close();

  console.log("Seed complete");
}

seed().catch(console.error);