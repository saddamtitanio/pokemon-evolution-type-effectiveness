import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Pokemon from "@/src/modules/pokemon/pokemon.model";
import { runBenchmark } from "@/benchmarks/scripts/mongodb/utils/benchmark";

const outputPath = path.join(
  process.cwd(),
  "benchmarks/scripts/mongodb/results/list_results.json"
);

async function benchmarkListQuery() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI in environment variables");
  }

  // Connect to MongoDB
  await mongoose.connect(mongoUri);

  const results = [];

  try {
    let queryResult: any = null;

    const stats = await runBenchmark(
      "mongodb-list-all",
      async () => {
        // Perform the find all query
        const res = await Pokemon.find();
        queryResult = res;
      },
      {
        iterations: 50,
        warmup: 5,
      }
    );

    results.push({
      query: "findAll",
      count: queryResult ? queryResult.length : 0,
      ...stats,
    });

    // Ensure results directory exists
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    // Write results to JSON file
    fs.writeFileSync(
      outputPath,
      JSON.stringify(results, null, 2)
    );

    console.log("MongoDB list-all query benchmark results saved to:", outputPath);
  } finally {
    // Disconnect MongoDB connection
    await mongoose.disconnect();
  }
}

benchmarkListQuery().catch(console.error);
