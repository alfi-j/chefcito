import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { dbManager } from '../lib/mongodb';

async function removeTasksCollection() {
  try {
    console.log('Connecting to MongoDB...');
    await dbManager.connect();
    console.log('Connected to MongoDB successfully\n');

    const db = await dbManager.getDb();
    
    // Check if tasks collection exists
    console.log('Checking for tasks collection...');
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log('Existing collections:', collectionNames);
    
    if (collectionNames.includes('tasks')) {
      console.log('\nTasks collection found. Removing it...');
      
      // Drop the tasks collection
      await db.dropCollection('tasks');
      console.log('Tasks collection removed successfully!');
    } else {
      console.log('\nTasks collection does not exist. Nothing to remove.');
    }
    
    // List remaining collections
    console.log('\nRemaining collections:');
    const remainingCollections = await db.listCollections().toArray();
    const remainingCollectionNames = remainingCollections.map(c => c.name);
    console.log(remainingCollectionNames);
    
    console.log('\nDatabase cleanup completed successfully!');
    
  } catch (error) {
    console.error('Error removing tasks collection:', error);
  } finally {
    await dbManager.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  removeTasksCollection().catch(console.error);
}

export default removeTasksCollection;