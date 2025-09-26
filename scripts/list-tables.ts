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

async function listTables() {
  const client = await pool.connect();
  
  try {
    // List all tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('Tables in the database:');
    console.log('======================');
    if (result.rows.length === 0) {
      console.log('No tables found');
    } else {
      // Expected tables based on the original database structure
      const expectedTables = [
        'categories',
        'customers',
        'inventory_items',
        'menu_items',
        'order_item_extras',
        'order_items',
        'order_status_history',
        'orders',
        'payment_methods',
        'staff',
        'tasks'
      ];
      
      const actualTables = result.rows.map(row => row.table_name);
      
      // Show expected tables
      console.log('Expected tables (11):');
      expectedTables.forEach(table => {
        const exists = actualTables.includes(table) ? '✓' : '✗';
        console.log(`  ${exists} ${table}`);
      });
      
      // Show any extra tables
      const extraTables = actualTables.filter(table => !expectedTables.includes(table));
      if (extraTables.length > 0) {
        console.log('\nUnexpected extra tables:');
        extraTables.forEach(table => {
          console.log(`  ⚠ ${table}`);
        });
      }
      
      console.log(`\nTotal tables: ${actualTables.length}`);
    }
  } catch (error) {
    console.error('Error listing tables:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  listTables().catch(console.error);
}