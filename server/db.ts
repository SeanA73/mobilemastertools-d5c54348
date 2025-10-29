import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

let pool: any;
let db: any;

// Configure database connection
if (process.env.DATABASE_URL) {
  pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  db = drizzle({ client: pool, schema });
} else {
  console.warn("⚠️  DATABASE_URL not set. Using mock database for development.");
  console.warn("⚠️  Some features (Voice Recordings, persistent data) will not work without a database.");
  
  // Create a mock pool that doesn't try to connect
  pool = {
    query: async () => ({ rows: [], rowCount: 0 }),
    connect: async () => ({
      query: async () => ({ rows: [], rowCount: 0 }),
      release: () => {},
    }),
  };
  
  // Create drizzle instance with mock pool
  db = drizzle({ client: pool, schema });
}

export { pool, db };
