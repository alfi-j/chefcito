import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import * as path from 'path';

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

async function testConnection() {
  const client = await pool.connect();
  
  try {
    console.log('Database connection successful!');
    
    // Get current time from database
    const result = await client.query('SELECT NOW() as current_time');
    console.log('Current time:', result.rows[0].current_time);
    
    // Test each table
    const tables = [
      'categories',
      'menu_items',
      'customers',
      'staff',
      'orders',
      'order_items',
      'order_item_extras',
      'order_status_history',
      'payment_methods',
      'inventory_items',
      'tasks'
    ];
    
    for (const table of tables) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`✓ Table ${table} exists with ${countResult.rows[0].count} records`);
      } catch (error) {
        console.log(`✗ Table ${table} does not exist or is not accessible`);
      }
    }
    
    console.log('Database connection test completed successfully');
  } catch (error) {
    console.error('Database connection test failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testConnection().catch(console.error);
}