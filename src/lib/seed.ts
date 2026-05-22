
import mongoose from 'mongoose';
import Pokemon from "@/src/modules/pokemon/pokemon.model"; 

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Please define the MONGODB_URI environment variable inside .env");
  process.exit(1);
}

const POKEMON_JSON_URL = "https://raw.githubusercontent.com/Purukitto/pokemon-data.json/master/pokedex.json";

async function seedDatabase() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI as string);
    console.log("Connected successfully!");

    console.log("Fetching Pokémon data...");
    const response = await fetch(POKEMON_JSON_URL);
    const rawPokemonData = await response.json();

    console.log("Transforming data to match Schema...");
    const formattedPokemon = rawPokemonData.map((p: any) => {

        let cleanName = p.name.english
        .replace(/♀/g, '-f')
        .replace(/♂/g, '-m');

        const slugName = cleanName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')    
        .replace(/-$/, '');
      
        const genderArray = p.profile?.gender ? p.profile.gender.split(':') : ["0", "0"];

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
            hp: p.base["HP"],
            attack: p.base["Attack"],
            defense: p.base["Defense"],
            special_attack: p.base["Sp. Attack"],  
            special_defense: p.base["Sp. Defense"], 
            speed: p.base["Speed"]
            }
        };
        });

        console.log("Clearing existing Pokémon collection...");
        await Pokemon.deleteMany({}); 

        console.log(`Seeding ${formattedPokemon.length} Pokémon into the database...`);
        await Pokemon.insertMany(formattedPokemon); 

        console.log("Database successfully seeded!");
    } catch (error) {
        console.error("Error seeding database:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
        process.exit(0);
    }
}

seedDatabase();