import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import { driver } from "@/src/lib/neo4j";
import { runBenchmark } from "@/benchmarks/scripts/neo4j/utils/benchmark";

const teams = [
  ["Charizard", "Dragonite", "Garchomp", "Lucario", "Blastoise", "Clefable"],
  ["Pikachu", "pikachu", "Pikachu", "Raichu"],
  ["Charizard", "NotAPokemon", "FakeMon", "Garchomp"],
  ["Bulbasaur", "Ivysaur", "Venusaur", "Charmander", "Charmeleon", "Charizard", "Squirtle"],
  ["dragonite", "DRAGONITE", "Dragonite", "Garchomp"],
  ["Lapras", "Weavile", "Mamoswine", "Glaceon", "Froslass"],
  ["Toxapex", "Ferrothorn", "Skarmory", "Blissey", "Corviknight", "Aegislash"],
  ["Charizard", "Arcanine", "Infernape", "Blaziken", "Talonflame", "Volcarona"],
  ["Pikachu", "Jolteon", "Raichu", "Zapdos", "Magnezone", "Electivire"],
  ["Mew", "Arceus", "Ditto", "Eevee", "MissingNo", "Smeargle"],
];

const outputPath = path.join(
  process.cwd(),
  "benchmarks/scripts/neo4j/results/validation_results.json"
);

async function benchmarkValidation() {
  const session = driver.session();
  const results = [];

  try {
    for (const team of teams) {
      let queryResult: any = null;

      const stats = await runBenchmark(
        `validation-${team.join("-")}`,
        async () => {
          const res = await session.run(
            `
            MATCH (p:Pokemon)-[:HAS_TYPE]->(t:Type)
            WHERE toLower(p.name) IN [name IN $team | toLower(name)]

            OPTIONAL MATCH (t)-[:WEAK_AGAINST]->(weakness:Type)
            OPTIONAL MATCH (t)-[:STRONG_AGAINST]->(strength:Type)
            OPTIONAL MATCH (t)-[:NO_EFFECT_ON]->(immune:Type)

            RETURN
              collect(DISTINCT weakness.name) AS weak_against,
              collect(DISTINCT strength.name) AS strong_against,
              collect(DISTINCT immune.name) AS no_effect
            `,
            { team }
          );

          queryResult = res.records.map((r) => ({
            weak_against: r.get("weak_against").filter(Boolean),
            strong_against: r.get("strong_against").filter(Boolean),
            no_effect: r.get("no_effect").filter(Boolean),
          }));

          console.log(JSON.stringify(queryResult, null, 2));
        },
        { iterations: 50, warmup: 10 }
      );

      results.push({
        team,
        result: queryResult,
        ...stats,
      });
    }

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

    console.log("Benchmark + results saved to:", outputPath);
  } finally {
    await session.close();
    await driver.close();
  }
}

benchmarkValidation().catch(console.error);