import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import mongoose from "mongoose";
import neo4j from "neo4j-driver";
import Pokemon from "../src/modules/pokemon/pokemon.model";

const MONGODB_URI = process.env.MONGODB_URI;
const NEO4J_URI = process.env.NEO4J_URI;
const NEO4J_USERNAME = process.env.NEO4J_USERNAME;
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;

if (!MONGODB_URI || !NEO4J_URI || !NEO4J_USERNAME || !NEO4J_PASSWORD) {
  console.error("Missing database environment variables in .env.local");
  process.exit(1);
}

const POKEMON_JSON_URL = "https://raw.githubusercontent.com/Purukitto/pokemon-data.json/master/pokedex.json";

// Type effectiveness chart
const TYPE_CHART = {
  fire: { strongAgainst: ["grass", "ice", "bug", "steel"], weakAgainst: ["fire", "water", "rock", "dragon"], noEffectOn: [] },
  water: { strongAgainst: ["fire", "ground", "rock"], weakAgainst: ["water", "grass", "dragon"], noEffectOn: [] },
  grass: { strongAgainst: ["water", "ground", "rock"], weakAgainst: ["fire", "grass", "poison", "flying", "bug", "dragon", "steel"], noEffectOn: [] },
  electric: { strongAgainst: ["water", "flying"], weakAgainst: ["electric", "grass", "dragon"], noEffectOn: ["ground"] },
  ground: { strongAgainst: ["fire", "electric", "poison", "rock", "steel"], weakAgainst: ["grass", "bug"], noEffectOn: ["flying"] },
  rock: { strongAgainst: ["fire", "ice", "flying", "bug"], weakAgainst: ["fighting", "ground", "steel"], noEffectOn: [] },
  ice: { strongAgainst: ["grass", "ground", "flying", "dragon"], weakAgainst: ["fire", "water", "ice", "steel"], noEffectOn: [] },
  fighting: { strongAgainst: ["normal", "ice", "rock", "dark", "steel"], weakAgainst: ["poison", "flying", "psychic", "bug", "fairy"], noEffectOn: [] },
  poison: { strongAgainst: ["grass", "fairy"], weakAgainst: ["poison", "ground", "rock", "ghost"], noEffectOn: ["steel"] },
  flying: { strongAgainst: ["grass", "fighting", "bug"], weakAgainst: ["electric", "rock", "steel"], noEffectOn: [] },
  bug: { strongAgainst: ["grass", "psychic", "dark"], weakAgainst: ["fire", "fighting", "poison", "flying", "ghost", "steel", "fairy"], noEffectOn: [] },
  psychic: { strongAgainst: ["fighting", "poison"], weakAgainst: ["psychic", "steel"], noEffectOn: ["dark"] },
  ghost: { strongAgainst: ["psychic", "ghost"], weakAgainst: ["dark"], noEffectOn: ["normal"] },
  dragon: { strongAgainst: ["dragon"], weakAgainst: ["steel"], noEffectOn: ["fairy"] },
  dark: { strongAgainst: ["psychic", "ghost"], weakAgainst: ["fighting", "dark", "fairy"], noEffectOn: [] },
  steel: { strongAgainst: ["ice", "rock", "fairy"], weakAgainst: ["fire", "water", "electric", "steel"], noEffectOn: [] },
  fairy: { strongAgainst: ["fighting", "dragon", "dark"], weakAgainst: ["fire", "poison", "steel"], noEffectOn: [] },
  normal: { strongAgainst: [], weakAgainst: ["rock", "steel"], noEffectOn: ["ghost"] }
};

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI!);
  console.log("MongoDB connected.");

  console.log("Connecting to Neo4j...");
  const neoDriver = neo4j.driver(NEO4J_URI!, neo4j.auth.basic(NEO4J_USERNAME!, NEO4J_PASSWORD!));
  await neoDriver.verifyConnectivity();
  console.log("Neo4j connected.");

  const session = neoDriver.session();

  try {
    console.log("Fetching Pokémon dataset...");
    const response = await fetch(POKEMON_JSON_URL);
    const pokedex = await response.json();
    console.log(`Fetched ${pokedex.length} Pokémon.`);

    // 1. Seed MongoDB
    console.log("Clearing MongoDB collection...");
    await Pokemon.deleteMany({});

    console.log("Formatting data for MongoDB...");
    const formattedPokemon = pokedex.map((p: any) => {
      let cleanName = p.name.english
        .replace(/♀/g, "-f")
        .replace(/♂/g, "-m");

      const slugName = cleanName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/-$/, "");

      const genderArray = p.profile?.gender ? p.profile.gender.split(":") : ["0", "0"];

      return {
        id: p.id,
        slug: slugName,
        name: p.name.english,
        description: p.description || "No description available.",
        category: p.species || "Unknown",
        height: p.profile?.height || "Unknown",
        weight: p.profile?.weight || "Unknown",
        gender: genderArray,
        imageUrl: p.image?.hires || p.image?.thumbnail || "",
        stats: {
          hp: p.base["HP"] || 0,
          attack: p.base["Attack"] || 0,
          defense: p.base["Defense"] || 0,
          special_attack: p.base["Sp. Attack"] || 0,
          special_defense: p.base["Sp. Defense"] || 0,
          speed: p.base["Speed"] || 0
        }
      };
    });

    console.log("Inserting Pokémon into MongoDB...");
    await Pokemon.insertMany(formattedPokemon);
    console.log("MongoDB seeding complete.");

    // 2. Seed Neo4j
    console.log("Clearing Neo4j database (Pokemon, Type, Team)...");
    await session.run("MATCH (n) DETACH DELETE n");

    console.log("Creating Pokemon nodes in Neo4j...");
    for (const p of pokedex) {
      await session.run(
        `
        CREATE (p:Pokemon {id: $id})
        SET p.name = $name,
            p.image = $image,
            p.description = $description,
            p.species = $species
        `,
        {
          id: p.id,
          name: p.name.english, // Keep actual english name case for UI
          image: p.image?.hires || p.image?.thumbnail || "",
          description: p.description || "",
          species: p.species || ""
        }
      );
    }

    console.log("Creating Type nodes and connections in Neo4j...");
    // Create types
    for (const type of Object.keys(TYPE_CHART)) {
      await session.run(
        `
        MERGE (t:Type {name: $name})
        `,
        { name: type }
      );
    }

    // Create type-to-type effectiveness relationships
    for (const [type, data] of Object.entries(TYPE_CHART)) {
      if (data.strongAgainst.length > 0) {
        await session.run(
          `
          MATCH (t:Type {name: $type})
          UNWIND $targets AS target
          MATCH (b:Type {name: target})
          MERGE (t)-[:STRONG_AGAINST]->(b)
          `,
          { type, targets: data.strongAgainst }
        );
      }
      if (data.weakAgainst.length > 0) {
        await session.run(
          `
          MATCH (t:Type {name: $type})
          UNWIND $targets AS target
          MATCH (b:Type {name: target})
          MERGE (t)-[:WEAK_AGAINST]->(b)
          `,
          { type, targets: data.weakAgainst }
        );
      }
      if (data.noEffectOn.length > 0) {
        await session.run(
          `
          MATCH (t:Type {name: $type})
          UNWIND $targets AS target
          MATCH (b:Type {name: target})
          MERGE (t)-[:NO_EFFECT_ON]->(b)
          `,
          { type, targets: data.noEffectOn }
        );
      }
    }

    console.log("Linking Pokemon to Types (HAS_TYPE) in Neo4j...");
    for (const p of pokedex) {
      if (!p.type) continue;
      for (const t of p.type) {
        await session.run(
          `
          MATCH (p:Pokemon {id: $pokemonId})
          MATCH (t:Type {name: $typeName})
          CREATE (p)-[:HAS_TYPE]->(t)
          `,
          {
            pokemonId: p.id,
            typeName: t.toLowerCase()
          }
        );
      }
    }

    console.log("Building Evolution Edges (EVOLVES_TO) in Neo4j...");
    const edges: { from: number; to: number }[] = [];
    for (const p of pokedex) {
      if (!p.evolution?.next) continue;
      for (const evo of p.evolution.next) {
        const evoId = Number(evo[0]);
        if (!evoId) continue;
        edges.push({
          from: p.id,
          to: evoId
        });
      }
    }

    await session.run(
      `
      UNWIND $edges AS edge
      MATCH (a:Pokemon {id: edge.from})
      MATCH (b:Pokemon {id: edge.to})
      CREATE (a)-[:EVOLVES_TO]->(b)
      `,
      { edges }
    );

    console.log("Neo4j seeding complete.");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    await session.close();
    await neoDriver.close();
    await mongoose.disconnect();
    console.log("Database connections closed.");
  }
}

seed().then(() => {
  console.log("All seeding finished successfully!");
  process.exit(0);
});
