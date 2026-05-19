import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import { driver } from "../../src/lib/neo4j";

const session = driver.session();

const pokedex = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "scripts/data/pokedex.json"),
    "utf-8"
  )
);

async function seed() {
  const edges: { from: string; to: string }[] = [];

  // CREATE ALL POKEMON NODES
  for (const p of pokedex) {
    const name = p.name?.english?.toLowerCase();
    if (!name) continue;

    await session.run(
      `MERGE (p:Pokemon {name: $name})`,
      { name }
    );
  }

  // BUILD EVOLUTION EDGES
  for (const p of pokedex) {
    const from = p.name?.english?.toLowerCase();
    if (!from) continue;

    if (p.evolution?.next) {
      for (const evo of p.evolution.next) {
        const to = evo?.name;
        if (!to) continue;

        edges.push({
          from,
          to: to.toLowerCase(),
        });
      }
    }
  }

  await session.run(
    `
    UNWIND $edges AS edge
    MATCH (a:Pokemon {name: edge.from})
    MATCH (b:Pokemon {name: edge.to})
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
    await session.run(
      `
      MERGE (t:Type {name: $type})

      WITH t
      UNWIND $strongAgainst AS target
      MERGE (b:Type {name: target})
      MERGE (t)-[:STRONG_AGAINST]->(b)

      WITH t
      UNWIND $weakAgainst AS target
      MERGE (b:Type {name: target})
      MERGE (t)-[:WEAK_AGAINST]->(b)

      WITH t
      UNWIND $noEffectOn AS target
      MERGE (b:Type {name: target})
      MERGE (t)-[:NO_EFFECT_ON]->(b)
      `,
      {
        type,
        strongAgainst: data.strongAgainst,
        weakAgainst: data.weakAgainst,
        noEffectOn: data.noEffectOn
      }
    );
  }

  console.log("Neo4j type graph built");

  const count = await session.run(`MATCH (n) RETURN count(n) AS total`);
  console.log("Total nodes:", count.records[0].get("total").toNumber());

  await session.close();
  await driver.close();

  console.log("Seed complete");
}

seed().catch(console.error);