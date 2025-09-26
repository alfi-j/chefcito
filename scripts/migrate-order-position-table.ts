#!/usr/bin/env node

/**
 * Script to create the order_position table in the database
 * Usage: npx tsx scripts/migrate-order-position-table.ts
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function createOrderPositionTable() {
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
    
    console.log('Creating order_position table...');
    
    // Create the order_position table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_position (
        id SERIAL PRIMARY KEY,
        tab_name VARCHAR(50) NOT NULL,
        order_id INTEGER NOT NULL,
        position INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tab_name, order_id)
      )
    `);
    
    // Add foreign key constraint to link order_position to orders
    try {
      await client.query(`
        ALTER TABLE order_position 
        ADD CONSTRAINT fk_order_position_order_id 
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      `);
      console.log('✅ Foreign key constraint added successfully');
    } catch (error: any) {
      // Constraint might already exist
      if (error.message.includes('constraint') && error.message.includes('already exists')) {
        console.log('✅ Foreign key constraint already exists');
      } else {
        console.log('ℹ️  Note: Foreign key constraint may already exist or table is not empty');
      }
    }
    
    // Create indexes for better query performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_order_position_tab_name ON order_position(tab_name);
      CREATE INDEX IF NOT EXISTS idx_order_position_order_id ON order_position(order_id);
      CREATE INDEX IF NOT EXISTS idx_order_position_position ON order_position(position);
    `);
    
    console.log('✅ order_position table created successfully!');
    
    // Show table structure
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'order_position' 
      ORDER BY ordinal_position
    `);
    
    console.log('\nTable structure:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    client.release();
  } catch (error) {
    console.error('❌ Error creating order_position table:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  createOrderPositionTable().catch(console.error);
}

export default createOrderPositionTable;