#!/usr/bin/env node

/**
 * Script to add foreign key constraint to order_position table
 * Usage: npx tsx scripts/add-foreign-key-constraint.ts
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function addForeignKeyConstraint() {
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
    
    console.log('Checking if foreign key constraint already exists...');
    
    // Check if the constraint already exists
    const constraintCheck = await client.query(`
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'order_position'::regclass 
      AND confrelid = 'orders'::regclass
      AND conname = 'fk_order_position_order_id'
    `);
    
    if (constraintCheck.rows.length > 0) {
      console.log('✅ Foreign key constraint already exists');
      client.release();
      return;
    }
    
    console.log('Cleaning up invalid records...');
    
    // Delete records in order_position that don't have corresponding orders
    const deleteResult = await client.query(`
      DELETE FROM order_position 
      WHERE order_id NOT IN (SELECT id FROM orders)
    `);
    
    console.log(`Deleted ${deleteResult.rowCount} invalid records`);
    
    console.log('Adding foreign key constraint...');
    
    // Add foreign key constraint
    await client.query(`
      ALTER TABLE order_position 
      ADD CONSTRAINT fk_order_position_order_id 
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    `);
    
    console.log('✅ Foreign key constraint added successfully!');
    
    client.release();
  } catch (error: any) {
    console.error('❌ Error adding foreign key constraint:', error.message);
    
    // Check if it's because the constraint already exists
    if (error.message.includes('constraint') && error.message.includes('already exists')) {
      console.log('✅ Foreign key constraint already exists');
    } else {
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  addForeignKeyConstraint().catch(console.error);
}

export default addForeignKeyConstraint;