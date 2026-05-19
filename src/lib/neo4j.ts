import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import neo4j from "neo4j-driver";

const uri = process.env.NEO4J_URI;
const username = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;

if (!uri || !username || !password) {
  throw new Error("Missing Neo4j environment variables");
}

export const driver = neo4j.driver(
  uri,
  neo4j.auth.basic(username, password)
);

async function test() {
  try {
    await driver.verifyConnectivity();
    console.log("Neo4j connected");
  } catch (error) {
    console.error(error);
  }
}

test();
