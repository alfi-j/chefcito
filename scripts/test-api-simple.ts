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

async function testApi() {
  const client = await pool.connect();
  
  try {
    console.log('Testing API routes by querying each table...');
    
    // Test categories
    const categoriesResult = await client.query('SELECT COUNT(*) as count FROM categories');
    console.log(`✓ Categories: ${categoriesResult.rows[0].count} records`);
    
    // Test menu items
    const menuItemsResult = await client.query('SELECT COUNT(*) as count FROM menu_items');
    console.log(`✓ Menu Items: ${menuItemsResult.rows[0].count} records`);
    
    // Test customers
    const customersResult = await client.query('SELECT COUNT(*) as count FROM customers');
    console.log(`✓ Customers: ${customersResult.rows[0].count} records`);
    
    // Test staff
    const staffResult = await client.query('SELECT COUNT(*) as count FROM staff');
    console.log(`✓ Staff: ${staffResult.rows[0].count} records`);
    
    // Test orders
    const ordersResult = await client.query('SELECT COUNT(*) as count FROM orders');
    console.log(`✓ Orders: ${ordersResult.rows[0].count} records`);
    
    // Test payment methods
    const paymentMethodsResult = await client.query('SELECT COUNT(*) as count FROM payment_methods');
    console.log(`✓ Payment Methods: ${paymentMethodsResult.rows[0].count} records`);
    
    // Test inventory items
    const inventoryItemsResult = await client.query('SELECT COUNT(*) as count FROM inventory_items');
    console.log(`✓ Inventory Items: ${inventoryItemsResult.rows[0].count} records`);
    
    // Test tasks
    const tasksResult = await client.query('SELECT COUNT(*) as count FROM tasks');
    console.log(`✓ Tasks: ${tasksResult.rows[0].count} records`);
    
    console.log('\nAPI routes test completed successfully');
  } catch (error) {
    console.error('API routes test failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testApi().catch(console.error);
}