import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import { driver } from "@/src/lib/neo4j";
import { runBenchmark } from "@/benchmarks/scripts/neo4j/utils/benchmark";

const pokemonList = [
  "Bulbasaur",
  "Charmander",
  "Squirtle",
  "Pikachu",
  "Eevee",
  "Jigglypuff",
  "Meowth",
  "Psyduck",
  "Machop",
  "Caterpie",
  "Weedle",
  "Zubat",
  "Magikarp",
  "Dratini",
  "Tyrogue",
  "Wurmple",
  "Clamperl",
  "Chikorita",
  "Cyndaquil",
  "Totodile",
  "Ralts",
  "Bagon",
  "Beldum",
  "Gible",
  "Riolu",
  "Lucario",
  "Garchomp",
  "Greninja",
  "Incineroar",
  "Dragapult",
  "Snorlax",
  "Lapras",
  "Dragonite",
  "Mewtwo",
  "Ditto",
];

const outputPath = path.join(
  process.cwd(),
  "benchmarks/scripts/neo4j/results/evolution_results.json"
);

async function benchmarkEvolution() {
  const session = driver.session();

  const results = [];

  try {
    for (const pokemon of pokemonList) {
      let queryResult: any = null;

      const stats = await runBenchmark(
        `evolution-${pokemon}`,

        async () => {
          const res = await session.run(
            `
                MATCH (base:Pokemon)
                WHERE NOT (:Pokemon)-[:EVOLVES_TO]->(base)
                AND (
                    toLower(base.name) = toLower($name)
                    OR (base)-[:EVOLVES_TO*]->(:Pokemon {name: $name})
                )

                MATCH path =
                (base)-[r:EVOLVES_TO*0..]->(member:Pokemon)

                WITH base, collect(DISTINCT member.name) AS members, relationships(path) AS rels

                UNWIND rels AS rel

                RETURN
                base.name AS base,
                members,
                collect(DISTINCT {
                    from: startNode(rel).name,
                    to: endNode(rel).name,
                    condition: rel.condition
                }) AS evolutions
            `,
            {
              name: pokemon.toLowerCase(),
            }
          );

          queryResult = res.records.map((r) => ({
            pokemon,
            base: r.get("base"),
            evolutions: r.get("evolutions").filter(Boolean),
          }));
        },

        {
          iterations: 50,
          warmup: 5,
        }
      );

      results.push({
        pokemon,
        result: queryResult,
        ...stats,
      });
    }

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    fs.writeFileSync(
      outputPath,
      JSON.stringify(results, null, 2)
    );

    console.log("Benchmark + results saved to:", outputPath);
  } finally {
    await session.close();
    await driver.close();
  }
}

benchmarkEvolution().catch(console.error);