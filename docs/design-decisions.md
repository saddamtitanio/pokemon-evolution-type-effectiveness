# Design Decisions

This document explains how the system is structured and why we chose different databases and approaches.

---

## 1. Using MongoDB and Neo4j

The project uses two databases because they are better for different types of data.

### MongoDB (Pokémon data)

- Stores Pokémon details like stats, height, weight, and descriptions.
- Works well because this data is structured and fits nicely in documents.
- It is faster for simple lookups like “get Pokémon info by id/name”.
- Keeps the graph database smaller by not storing heavy descriptive data there.

### Neo4j (relationships)

- Stores connections between data (graph structure).

Used for:

- Pokémon evolution chains
- Type effectiveness (strengths and weaknesses)
- Team relationships

Why Neo4j:

- Evolution is naturally a chain (A -> B -> C)
- Type matchups depend on relationships between types
- Graph queries make it easy to explore connections without complex joins

---

## 2. Type Weakness Calculation

Type weaknesses are calculated using relationships between types.

For example:

- If Fire is strong against Grass, then Grass is weak against Fire.

The backend checks these relationships in real time to calculate how strong or weak a team is against different types.

---

## 3. Matching Pokémon Names

MongoDB and Neo4j use different naming formats, so we avoid using names directly between them.

Instead:

- MongoDB uses clean “slug” names (like `nidoran-f`)
- Neo4j uses display names (like `Nidoran ♀`)

To fix this, we use the Pokémon ID (Pokedex number) as a shared reference.
