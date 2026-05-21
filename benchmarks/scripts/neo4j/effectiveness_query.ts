import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import { driver } from "@/src/lib/neo4j";
import { runBenchmark } from "@/benchmarks/scripts/neo4j/utils/benchmark";

const types = [
  "Normal","Fire","Water","Grass","Electric","Ice",
  "Fighting","Poison","Ground","Flying","Psychic","Bug",
  "Rock","Ghost","Dragon","Dark","Steel","Fairy",
];

const outputPath = path.join(
  process.cwd(),
  "benchmarks/scripts/neo4j/results/effectiveness_results.json"
);

async function benchmarkEffectiveness() {
  const session = driver.session();
  const results = [];

  try {
    for (const type of types) {
      let queryResult: any = null;

      const stats = await runBenchmark(
        `effectiveness-${type}`,
        async () => {
          const res = await session.run(
            `
            MATCH (t:Type {name: $type})

            OPTIONAL MATCH (t)-[:STRONG_AGAINST]->(strong:Type)
            WITH t, collect(DISTINCT strong.name) AS strong

            OPTIONAL MATCH (t)-[:WEAK_AGAINST]->(weak:Type)
            WITH t, strong, collect(DISTINCT weak.name) AS weak

            OPTIONAL MATCH (t)-[:NO_EFFECT_ON]->(immune:Type)

            RETURN
              strong,
              weak,
              collect(DISTINCT immune.name) AS noEffect
            `,
            {
              type: type.toLowerCase(),
            }
          );

          queryResult = res.records.map((r) => ({
            type,
            strong: r.get("strong").filter(Boolean),
            weak: r.get("weak").filter(Boolean),
            noEffect: r.get("noEffect").filter(Boolean),
          }));
        },
        { iterations: 50, warmup: 5 }
      );

      results.push({
        type,
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

benchmarkEffectiveness().catch(console.error);