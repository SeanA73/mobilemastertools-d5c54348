import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

let pool: any;
let db: any;

// Configure database connection
if (process.env.DATABASE_URL) {
  neonConfig.webSocketConstructor = ws;
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
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
