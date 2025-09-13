// Load environment variables when run as a standalone script
if (typeof require !== 'undefined' && require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '../../.env.local') });
}

import { query } from './db';

async function testDatabaseConnection() {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.log('DATABASE_URL environment variable not set. Database connection test skipped.');
      return;
    }
    
    console.log('Testing database connection...');
    const result = await query('SELECT NOW() as now');
    console.log('Database connection successful!');
    console.log('Current time from database:', result.rows[0].now);
  } catch (error) {
    console.error('Database connection failed:', error);
    console.log('Please check your DATABASE_URL environment variable and ensure your database is accessible.');
  }
}

// Run the test if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  testDatabaseConnection();
}

export default testDatabaseConnection;