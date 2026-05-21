import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import { performance } from "perf_hooks";
import { driver } from "@/src/lib/neo4j";
import { runBenchmark } from "@/benchmarks/scripts/neo4j/utils/benchmark";

// Teams for testing
const teams = [
  ["Charizard", "Dragonite", "Salamence", "Garchomp", "Hydreigon", "Goodra"],
  ["Blastoise", "Swampert", "Milotic", "Lapras", "Toxapex", "Vaporeon"],
  ["Pikachu", "Raichu", "Zapdos", "Electivire", "Magnezone", "Luxray"],
  ["Charizard", "Arcanine", "Infernape", "Blaziken", "Talonflame", "Volcarona"],
  ["Venusaur", "Roserade", "Ferrothorn", "Sceptile", "Ludicolo", "Shiftry"],
  ["Garchomp", "Tyranitar", "Rotom", "Clefable", "Scizor", "Excadrill"],
  ["Lapras", "Weavile", "Mamoswine", "Glaceon", "Froslass", "Aurorus"],
  ["Lucario", "Machamp", "Conkeldurr", "Breloom", "Hawlucha", "Gallade"],
  ["Toxapex", "Gengar", "Crobat", "Muk", "Roserade", "Garbodor"],
  ["Eevee", "Ditto", "Smeargle", "Porygon-Z", "Arceus", "Mew"]
];

// Output file
const outputPath = path.join(
  process.cwd(),
  "benchmarks/scripts/neo4j/results/weakness_results.json"
);

// Verify Pokémon exist
async function verifyTestCases(session: any) {
    const allPokemon = Array.from(new Set(teams.flat()));

    const result = await session.run(
        `
        UNWIND $names AS name
        MATCH (p:Pokemon)
        WHERE toLower(p.name) = toLower(name)
        RETURN collect(toLower(p.name)) AS found
        `,
        { names: allPokemon }
    );

    const found = result.records.length > 0
        ? new Set(result.records[0].get("found"))
        : new Set();

    const missing = allPokemon.filter(p => !found.has(p.toLowerCase()));
    if (missing.length > 0) {
        console.warn("Missing Pokémon:", missing);
    }
    else console.log("All Pokémon exist in database");
}

async function benchmarkWeaknessAnalysis() {
  const session = driver.session();
  await verifyTestCases(session);

  const results: any[] = [];

  try {
    for (const team of teams) {
        let queryResult: any = null;

        // Benchmark query
        const stats = await runBenchmark(
            `weakness-${team.join("-")}`,
            async () => {
            const res = await session.run(
                `
                MATCH (p:Pokemon)-[:HAS_TYPE]->(t:Type)
                WHERE toLower(p.name) IN [name IN $team | toLower(name)]

                OPTIONAL MATCH (t)-[:WEAK_AGAINST]->(weak:Type)
                OPTIONAL MATCH (t)-[:STRONG_AGAINST]->(strong:Type)
                OPTIONAL MATCH (t)-[:NO_EFFECT_ON]->(immune:Type)

                RETURN
                collect(DISTINCT weak.name) AS weak_against,
                collect(DISTINCT strong.name) AS strong_against,
                collect(DISTINCT immune.name) AS no_effect
                `,
                { team }
            );

            queryResult = res.records.map(r => ({
                weak_against: r.get("weak_against").filter(Boolean),
                strong_against: r.get("strong_against").filter(Boolean),
                no_effect: r.get("no_effect").filter(Boolean),
            }));

            console.log(`Team ${team.length} Pokémon:`, JSON.stringify(queryResult, null, 2));
            },
            { iterations: 50, warmup: 5 }
        );

        const res = await session.run(
            `
            MATCH (p:Pokemon)-[:HAS_TYPE]->(t:Type)
            WHERE toLower(p.name) IN [name IN $team | toLower(name)]

            OPTIONAL MATCH (t)-[:WEAK_AGAINST]->(weak:Type)
            OPTIONAL MATCH (t)-[:STRONG_AGAINST]->(strong:Type)
            OPTIONAL MATCH (t)-[:NO_EFFECT_ON]->(immune:Type)

            RETURN
            collect(DISTINCT weak.name) AS weak_against,
            collect(DISTINCT strong.name) AS strong_against,
            collect(DISTINCT immune.name) AS no_effect
            `,
            { team }
        );

        const weaknesses = res.records.map(r => ({
            weak_against: r.get("weak_against").filter(Boolean),
            strong_against: r.get("strong_against").filter(Boolean),
            no_effect: r.get("no_effect").filter(Boolean),
        }));

        results.push({
            team,
            team_size: team.length,
            weaknesses,
            benchmark: stats
        });
    }

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log("Results saved to:", outputPath);
  } finally {
    await session.close();
    await driver.close();
  }
}

benchmarkWeaknessAnalysis().catch(console.error);