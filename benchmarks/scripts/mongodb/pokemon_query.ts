import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Pokemon from "@/src/modules/pokemon/pokemon.model";
import { runBenchmark } from "@/benchmarks/scripts/mongodb/utils/benchmark";

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
  "benchmarks/scripts/mongodb/results/pokemon_results.json"
);

async function benchmarkPokemonQuery() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI in environment variables");
  }

  // Connect to MongoDB
  await mongoose.connect(mongoUri);

  const results = [];

  try {
    for (const pokemon of pokemonList) {
      const slug = pokemon
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/-$/, "");

      let queryResult: any = null;

      const stats = await runBenchmark(
        `mongodb-pokemon-${slug}`,
        async () => {
          // Perform the findOne query
          const res = await Pokemon.findOne({ slug });
          queryResult = res;
        },
        {
          iterations: 50,
          warmup: 5,
        }
      );

      results.push({
        pokemon,
        slug,
        result: queryResult ? { id: queryResult.id, name: queryResult.name, slug: queryResult.slug } : null,
        ...stats,
      });
    }

    // Ensure results directory exists
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    // Write results to JSON file
    fs.writeFileSync(
      outputPath,
      JSON.stringify(results, null, 2)
    );

    console.log("MongoDB single-pokemon query benchmark results saved to:", outputPath);
  } finally {
    // Disconnect MongoDB connection
    await mongoose.disconnect();
  }
}

benchmarkPokemonQuery().catch(console.error);
