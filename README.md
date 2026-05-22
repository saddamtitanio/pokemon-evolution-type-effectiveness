# Pokémon Evolution & Type Effectiveness Analysis Network

A high-performance multi-database web application designed to query, traverse, and build Pokémon teams, utilizing **MongoDB** for document archives and **Neo4j** for relational graph networks.

---

## 1. System Architecture

The application separates concerns by storing flat documents and base statistics in MongoDB while using Neo4j for relationship-heavy traversals such as evolution paths, element type effectiveness, and team building.

```mermaid
graph TD
    Client[Next.js Web Client] -->|API Request| APILayer[Next.js API Layer]
    APILayer -->|MongoDB Query| MongoDB[(MongoDB Atlas / Local)]
    APILayer -->|Cypher Session| Neo4j[(Neo4j Aura / Local)]
```

### Module Features

1. **Pokédex (MongoDB)**: Search Pokémon and view detailed stats, descriptions, categories, heights, and weights.
2. **Evolution Chain Graph (Neo4j)**: Traverse evolution paths downstream using variable-length relationship matching and render as BFS-level columns.
3. **Type Effectiveness (Neo4j)**: Analyze offensive type multipliers and defensive element vulnerabilities on a dedicated interactive details page.
4. **Team Builder (Neo4j & MongoDB)**: Build teams of up to 6 members, run live validation checks for duplicates, and evaluate team vulnerabilities using Neo4j type relationships.

---

## 2. Getting Started

### Local Setup (Using Docker Compose)

The entire three-tier stack (MongoDB, Neo4j, and Next.js) can be launched locally using a single command:

1. Clone or copy the project files to your environment.
2. Run the build and start commands:
   ```bash
   docker compose up --build
   ```
3. Once the database services report healthy, the Next.js server will be available at `http://localhost:3000`.

### Manual Development Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Configure environment variables**: (example .env)
   Create a `.env.local` file in the root directory:

   ```env
   MONGODB_URI=mongodb://localhost:27017/pokemondb
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USERNAME=neo4j
   NEO4J_PASSWORD=password
   ```

3. **Seed the database**:
   Run the seeding script to populate MongoDB and Neo4j nodes/relationships with the Purukitto Pokémon dataset:

   ```bash
   npm run seed
   ```

4. **Start Next.js development server**:
   ```bash
   npm run dev
   ```

---

## 3. Benchmarking Neo4j Operations

Performance tests were executed on query response latencies using remote Neo4j Aura databases. Benchmark results and metrics plots are stored in:

- benchmarks/scripts/neo4j/results/
- benchmarks/scripts/neo4j/plots/
- benchmarks/scripts/mongoDB/results/
- benchmarks/scripts/mongoDB/plots/

To run the benchmarks manually:

```bash
npx tsx benchmarks/scripts/neo4j/effectiveness_query.ts
npx tsx benchmarks/scripts/neo4j/evolution_query.ts
npx tsx benchmarks/scripts/neo4j/team_validation.ts
npx tsx benchmarks/scripts/neo4j/weakness_analysis.ts
```

To plot the performance latency graphs:

```bash
python benchmarks/scripts/neo4j/plot_results.py
```

---

## 4. Design & Implementation Decisions

Detailed design and system configuration documentation is available in the `docs` folder:

- docs/architecture.md: System layout and transaction sequence diagrams.
- docs/data-models.md: MongoDB document schemas and Neo4j node/edge attributes.
- docs/design-decisions.md: Choices behind polyglot storage splits, dynamic calculations, and casing resolutions.
- docs/graph-schema.md: Graphic diagram of nodes and connections.

---

## 5. Team Info & Citations

### Team Members

- Saddam Titanio (2406450472)
- Nicolas Chriscia (2406369015)
- Hafizh Akbar Ghifarie Ramadhan (2406450384)

### Citations and AI Assistance Acknowledgement

- Pokémon dataset sourced from the public repository [Purukitto/pokemon-data.json](https://github.com/Purukitto/pokemon-data.json).
- AI Assistant was used exclusively to assist with script writing, plotting latency graphs, database seeding, drafting documentation files, and making the Dockerfile, Verification was done by running the code and logically visualized with the graph.
