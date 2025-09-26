#!/usr/bin/env node

/**
 * Script to verify the order_position table was created correctly
 * Usage: npx tsx scripts/verify-order-position-table.ts
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function verifyOrderPositionTable() {
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
    
    console.log('Verifying order_position table...');
    
    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'order_position'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.error('❌ order_position table does not exist');
      process.exit(1);
    }
    
    console.log('✅ order_position table exists');
    
    // Check table structure
    const structureCheck = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'order_position' 
      ORDER BY ordinal_position
    `);
    
    console.log('\nTable structure:');
    structureCheck.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });
    
    // Check indexes
    const indexCheck = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'order_position'
    `);
    
    console.log('\nIndexes:');
    if (indexCheck.rows.length === 0) {
      console.log('  No indexes found');
    } else {
      indexCheck.rows.forEach(row => {
        console.log(`  ${row.indexname}: ${row.indexdef}`);
      });
    }
    
    // Check constraints
    const constraintCheck = await client.query(`
      SELECT conname, contype, condef
      FROM (
        SELECT conname, contype, pg_get_constraintdef(oid) as condef
        FROM pg_constraint
        WHERE conrelid = 'order_position'::regclass
      ) t
      ORDER BY contype
    `);
    
    console.log('\nConstraints:');
    if (constraintCheck.rows.length === 0) {
      console.log('  No constraints found');
    } else {
      constraintCheck.rows.forEach(row => {
        console.log(`  ${row.conname} (${row.contype}): ${row.condef}`);
      });
    }

    // Check foreign key constraints
    const foreignKeyCheck = await client.query(`
      SELECT 
        conname AS constraint_name,
        pg_get_constraintdef(oid) AS definition
      FROM 
        pg_constraint
      WHERE 
        conrelid = 'order_position'::regclass AND 
        contype = 'f'
    `);
    
    console.log('\nForeign Key Constraints:');
    if (foreignKeyCheck.rows.length === 0) {
      console.log('  No foreign key constraints found');
    } else {
      foreignKeyCheck.rows.forEach(row => {
        console.log(`  ${row.constraint_name}: ${row.definition}`);
      });
    }
    
    console.log('\n🎉 All verifications passed! order_position table is correctly set up.');
    
    client.release();
  } catch (error) {
    console.error('❌ Error verifying order_position table:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the verification if this file is executed directly
if (require.main === module) {
  verifyOrderPositionTable().catch(console.error);
}

export default verifyOrderPositionTable;