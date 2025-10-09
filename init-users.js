const { dbManager } = require('./src/lib/mongodb');

async function initUsers() {
  try {
    console.log('Connecting to MongoDB...');
    
    await dbManager.connect();
    console.log('Connected to MongoDB successfully');
    
    // Close the connection
    await dbManager.close();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

initUsers().catch(console.error);