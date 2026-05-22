# Graph Schema (Neo4j)

This document describes the graph structure used in the project with Neo4j.

---

## 1. Nodes

### Pokemon

Represents a Pokemon in the system.

Fields:

- id (number)
- name (string)
- image (string)
- species (string)

---

### Type

Represents a Pokemon type (for example: Fire, Water).

Fields:

- name (string)

---

### Team

Represents a user-created Pokemon team.

Fields:

- id (number or string)
- name (string)

---

## 2. Relationships

### Evolution relationships

- (Pokemon)-[:EVOLVES_TO]->(Pokemon)

Used to show evolution chains between Pokemon.

---

### Type relationships

- (Pokemon)-[:HAS_TYPE]->(Type)

Used to link a Pokemon to its type(s).

---

### Type effectiveness

- (Type)-[:STRONG_AGAINST]->(Type)
- (Type)-[:WEAK_AGAINST]->(Type)
- (Type)-[:NO_EFFECT_ON]->(Type)

Used to calculate battle advantages and weaknesses.

---

### Team relationships

- (Team)-[:HAS_POKEMON]->(Pokemon)

Used to store Pokemon inside a user’s team.
