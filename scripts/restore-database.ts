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

async function restoreDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if we have the correct columns in orders table
    try {
      // Try to remove the JSON columns if they exist
      await client.query(`ALTER TABLE orders DROP COLUMN IF EXISTS items`);
      console.log('✓ Removed items column from orders table (if it existed)');
    } catch (error) {
      console.log('ℹ Note about items column:', (error as any).message);
    }
    
    try {
      // Try to remove the JSON columns if they exist
      await client.query(`ALTER TABLE orders DROP COLUMN IF EXISTS status_history`);
      console.log('✓ Removed status_history column from orders table (if it existed)');
    } catch (error) {
      console.log('ℹ Note about status_history column:', (error as any).message);
    }
    
    // Check if we have all the required tables
    const requiredTables = [
      'categories',
      'customers',
      'inventory_items',
      'menu_items',
      'orders',
      'order_items',
      'order_item_extras',
      'order_status_history',
      'payment_methods',
      'staff',
      'tasks'
    ];
    
    // Get current tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const currentTables = result.rows.map(row => row.table_name);
    
    // Check for missing tables
    const missingTables = requiredTables.filter(table => !currentTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log(`⚠ Missing tables: ${missingTables.join(', ')}`);
      console.log('  You may need to run the migrate-schema script to create these tables');
    } else {
      console.log('✓ All required tables are present');
    }
    
    await client.query('COMMIT');
    console.log('\nDatabase structure verification completed');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database structure verification failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  restoreDatabase().catch(console.error);
}