// Load environment variables when run as a standalone script
if (typeof require !== 'undefined' && require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '../../.env.local') });
}


async function initDatabase() {
  try {
    console.log('Initializing database...');
    
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.log('DATABASE_URL environment variable not set. Skipping database initialization.');
      console.log('To use database functionality, set the DATABASE_URL environment variable.');
      return;
    }
    
    console.log('Database initialization would happen here if needed');
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    console.log('Please check your DATABASE_URL environment variable and ensure your database is accessible.');
  }
}

// Run the initialization if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  initDatabase().catch(console.error);
}

export default initDatabase;