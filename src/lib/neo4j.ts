import neo4j from 'neo4j-driver';

const URI = process.env.NEO4J_URI as string;
const USER = process.env.NEO4J_USER as string;
const PASSWORD = process.env.NEO4J_PASSWORD as string;

export const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));

export const testConnection = async () => {
  try {
    const serverInfo = await driver.getServerInfo();
    console.log('Connection established');
    console.log(serverInfo);
  } catch (err) {
    console.error('Neo4j connection error:', err);
  } finally {
    await driver.close();
  }
};