#!/usr/bin/env tsx

/**
 * Simple database connection test script
 * This script tests if we can connect to the database
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { Pool } from 'pg';

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...\n');
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  console.log(`🔧 DATABASE_URL: ${process.env.DATABASE_URL.substring(0, 30)}...`);
  
  try {
    // Create a new pool with the DATABASE_URL
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    // Try to connect
    console.log('🔌 Attempting to connect to database...');
    const client = await pool.connect();
    
    // Run a simple query
    console.log('📝 Running test query...');
    const result = await client.query('SELECT NOW() as now');
    
    console.log('✅ Database connection successful!');
    console.log(`⏰ Database time: ${result.rows[0].now}`);
    
    // Release the client
    client.release();
    
    // Close the pool
    await pool.end();
    
    console.log('\n🎉 All tests passed! Database is accessible.');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Run the test
testDatabaseConnection();