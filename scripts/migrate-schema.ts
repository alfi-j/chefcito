import { Pool } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Load environment variables
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function migrateSchema() {
  const client = await pool.connect();
  
  try {
    // Read the schema file
    const schema = fs.readFileSync(path.join(__dirname, '../docs/database-schema.sql'), 'utf-8');
    
    // Split by CREATE statements
    const statements = schema.split('\n-- ')
      .map(section => section.trim())
      .filter(section => section.length > 0);
    
    // Process each section to extract the actual SQL
    const sqlStatements: string[] = [];
    
    for (const section of statements) {
      // Skip the initial comment
      if (section.startsWith('Database Schema')) {
        continue;
      }
      
      // Extract the actual SQL statement (everything after the first line)
      const lines = section.split('\n');
      const sqlLines = lines.slice(1); // Skip the comment line
      const sqlStatement = sqlLines.join('\n').trim();
      
      if (sqlStatement.length > 0) {
        sqlStatements.push(sqlStatement);
      }
    }
    
    console.log(`Found ${sqlStatements.length} SQL statements in schema file`);
    
    // Execute each statement
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i];
      
      try {
        console.log(`\nExecuting statement ${i + 1}/${sqlStatements.length}:`);
        const firstLine = statement.split('\n')[0];
        console.log(firstLine.substring(0, 100) + (firstLine.length > 100 ? '...' : ''));
        
        const result = await client.query(statement);
        console.log(`✓ Success`);
      } catch (error: unknown) {
        console.error(`✗ Error executing statement ${i + 1}:`, (error as Error).message);
        // For "already exists" errors, continue as they might already exist
        if (!((error as Error).message.includes('already exists'))) {
          throw error;
        }
      }
    }
    
    console.log('\nSchema migration completed successfully');
  } catch (error) {
    console.error('Schema migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  migrateSchema().catch(console.error);
}