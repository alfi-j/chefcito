import { Pool } from '@neondatabase/serverless';

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export { pool };