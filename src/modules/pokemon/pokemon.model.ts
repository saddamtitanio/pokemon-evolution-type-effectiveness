import mongoose, { Schema, Document } from 'mongoose';

export interface IPokemon extends Document {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: string;
  height: string;
  weight: string;
  gender: string[];
  stats: {
    hp: number;
    attack: number;
    defense: number;
    special_attack: number;
    special_defense: number;
    speed: number;
  };
  
  imageUrl: string;
}

const PokemonSchema = new Schema<IPokemon>({
  id: { type: Number, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true }, 
  category: { type: String, required: true },    
  height: { type: String, required: true },      
  weight: { type: String, required: true },      
  gender: { type: [String], required: true },    
  stats: {
    hp: { type: Number, required: true },
    attack: { type: Number, required: true },
    defense: { type: Number, required: true },
    special_attack: { type: Number, required: true },
    special_defense: { type: Number, required: true },
    speed: { type: Number, required: true }
  },
  imageUrl: { type: String, required: true }     
});

export default mongoose.models.Pokemon || mongoose.model<IPokemon>("Pokemon", PokemonSchema);