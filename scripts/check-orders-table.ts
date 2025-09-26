#!/usr/bin/env node

/**
 * Script to check the orders table structure
 * Usage: npx tsx scripts/check-orders-table.ts
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function checkOrdersTable() {
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
    
    console.log('Checking orders table structure...');
    
    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'orders'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.error('❌ orders table does not exist');
      process.exit(1);
    }
    
    console.log('✅ orders table exists');
    
    // Show table structure
    const structureCheck = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      ORDER BY ordinal_position
    `);
    
    console.log('\nOrders table structure:');
    structureCheck.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });
    
    // Check primary key
    const pkCheck = await client.query(`
      SELECT a.attname AS column_name
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = 'orders'::regclass AND i.indisprimary
    `);
    
    console.log('\nPrimary key:');
    if (pkCheck.rows.length > 0) {
      pkCheck.rows.forEach(row => {
        console.log(`  ${row.column_name}`);
      });
    } else {
      console.log('  No primary key found');
    }
    
    client.release();
  } catch (error) {
    console.error('❌ Error checking orders table:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the check if this file is executed directly
if (require.main === module) {
  checkOrdersTable().catch(console.error);
}

export default checkOrdersTable;