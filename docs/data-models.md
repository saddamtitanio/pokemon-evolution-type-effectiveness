# Data Models

This document outlines the detailed schemas and structures used in the MongoDB document store and the Neo4j graph database.

---

## 1. MongoDB Document Store

MongoDB functions as the primary store for raw Pokémon details, base stats, and physical descriptions.

### Pokemon Document Schema

- Collection Name: `pokemons`
- Model Name: `Pokemon`
- Structure:

```typescript
interface IPokemon {
  id: number; // National Pokedex ID (unique)
  slug: string; // URL-friendly slug name
  name: string; // Standard English name
  description: string; // Pokedex description entry
  category: string; // Pokemon species category
  height: string; // Height (metric strings)
  weight: string; // Weight (metric strings)
  gender: string[]; // Array of gender ratio percentages [male, female]
  stats: {
    hp: number;
    attack: number;
    defense: number;
    special_attack: number;
    special_defense: number;
    speed: number;
  };
  imageUrl: string; // URL to high-resolution image asset
}
```

---

## 2. Neo4j Graph Database

Neo4j is utilized to manage relationships such as evolution paths, element types, type-to-type effectiveness, and user-built teams.

### Nodes

#### 1. Pokemon Node

- Label: `:Pokemon`
- Properties:
  - `id` (Integer): Matches MongoDB `id` for sync querying.
  - `name` (String): Display name (for example, `"Nidoran ♀"`).
  - `image` (String): URL of the asset image.
  - `description` (String): Text description.
  - `species` (String): Species classification.

#### 2. Type Node

- Label: `:Type`
- Properties:
  - `name` (String): Lowercase type name (e.g. `"fire"`, `"water"`).

#### 3. Team Node

- Label: `:Team`
- Properties:
  - `id` (String): Unique team ID (e.g. `"team_3z8x1p4_1684789..."`).
  - `name` (String): User-supplied name for the team.

### Relationships

#### 1. HAS_TYPE

- Path: `(:Pokemon)-[:HAS_TYPE]->(:Type)`
- Meaning: Pokémon belongs to a particular elemental type.

#### 2. EVOLVES_TO

- Path: `(:Pokemon)-[:EVOLVES_TO]->(:Pokemon)`
- Meaning: Direct evolutionary path from one Pokémon to its successor.

#### 3. HAS_POKEMON

- Path: `(:Team)-[:HAS_POKEMON]->(:Pokemon)`
- Meaning: A team node contains up to 6 distinct Pokémon nodes.

#### 4. Type Matchups

- Strong Attack: `(:Type)-[:STRONG_AGAINST]->(:Type)` (2.0x damage dealt)
- Weak Attack: `(:Type)-[:WEAK_AGAINST]->(:Type)` (0.5x damage dealt)
- Immune Attack: `(:Type)-[:NO_EFFECT_ON]->(:Type)` (0.0x damage dealt)
