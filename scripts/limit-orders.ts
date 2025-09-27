#!/usr/bin/env tsx

/**
 * Script to limit the number of orders to 4
 * This script will delete all orders except for the first 4
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

import { Pool } from 'pg';

async function limitOrders() {
  console.log('🔍 Limiting orders to 4...\n');
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  try {
    // Create a new pool with the DATABASE_URL
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    // Try to connect
    console.log('🔌 Connecting to database...');
    const client = await pool.connect();
    
    try {
      // Get the count of all orders
      const countResult = await client.query('SELECT COUNT(*) as count FROM orders');
      const totalOrders = parseInt(countResult.rows[0].count);
      
      console.log(`📊 Total orders: ${totalOrders}`);
      
      if (totalOrders <= 4) {
        console.log('✅ Already 4 or fewer orders. Nothing to do.');
        await client.release();
        await pool.end();
        return;
      }
      
      // Get the IDs of the first 4 orders (oldest ones)
      const firstFourResult = await client.query(
        'SELECT id FROM orders ORDER BY created_at ASC LIMIT 4'
      );
      const firstFourIds = firstFourResult.rows.map(row => row.id);
      
      console.log(`Keeping order IDs: ${firstFourIds.join(', ')}`);
      
      // Delete all orders except the first 4
      const placeholders = firstFourIds.map((_, i) => `$${i + 1}`).join(', ');
      const deleteQuery = `DELETE FROM orders WHERE id NOT IN (${placeholders})`;
      await client.query(deleteQuery, firstFourIds);
      
      // Get the new count of orders
      const newCountResult = await client.query('SELECT COUNT(*) as count FROM orders');
      const newTotalOrders = parseInt(newCountResult.rows[0].count);
      
      console.log(`✅ Successfully limited orders. New total: ${newTotalOrders}`);
    } finally {
      // Release the client
      client.release();
    }
    
    // Close the pool
    await pool.end();
  } catch (error) {
    console.error('❌ Error limiting orders:', error);
    process.exit(1);
  }
}

// Run the function
limitOrders();