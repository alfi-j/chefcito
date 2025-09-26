#!/usr/bin/env node

/**
 * Script to check existing orders in the database
 * Usage: npx tsx scripts/check-existing-orders.ts
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function checkExistingOrders() {
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('Please set the DATABASE_URL in your .env file');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    console.log('Checking existing orders...');
    
    // Get some existing orders
    const result = await client.query(`
      SELECT id, table_number, created_at 
      FROM orders 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('\nExisting orders:');
    if (result.rows.length === 0) {
      console.log('  No orders found');
    } else {
      result.rows.forEach(row => {
        console.log(`  ID: ${row.id}, Table: ${row.table_number}, Created: ${row.created_at}`);
      });
    }
    
    client.release();
  } catch (error) {
    console.error('❌ Error checking existing orders:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the check if this file is executed directly
if (require.main === module) {
  checkExistingOrders().catch(console.error);
}

export default checkExistingOrders;