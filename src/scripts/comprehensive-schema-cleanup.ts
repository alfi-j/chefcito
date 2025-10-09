import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { dbManager } from '../lib/mongodb';

async function comprehensiveSchemaCleanup() {
  try {
    console.log('Connecting to MongoDB...');
    await dbManager.connect();
    console.log('Connected to MongoDB successfully\n');

    const db = await dbManager.getDb();
    
    // List all collections before cleanup
    console.log('1. Current collections in database:');
    const collectionsBefore = await db.listCollections().toArray();
    const collectionNamesBefore = collectionsBefore.map(c => c.name);
    console.log(collectionNamesBefore);
    
    // Remove tasks collection if it exists
    if (collectionNamesBefore.includes('tasks')) {
      console.log('\n2. Removing tasks collection...');
      await db.dropCollection('tasks');
      console.log('Tasks collection removed successfully!');
    } else {
      console.log('\n2. Tasks collection not found. Skipping removal.');
    }
    
    // Check for any other potentially deprecated collections
    const deprecatedCollections = ['todos', 'taskAssignments', 'taskComments'];
    let removedCount = 0;
    
    console.log('\n3. Checking for other deprecated collections...');
    for (const collectionName of deprecatedCollections) {
      if (collectionNamesBefore.includes(collectionName)) {
        console.log(`Removing deprecated collection: ${collectionName}`);
        await db.dropCollection(collectionName);
        removedCount++;
      }
    }
    
    if (removedCount === 0) {
      console.log('No other deprecated collections found.');
    } else {
      console.log(`Removed ${removedCount} deprecated collections.`);
    }
    
    // List all collections after cleanup
    console.log('\n4. Collections after cleanup:');
    const collectionsAfter = await db.listCollections().toArray();
    const collectionNamesAfter = collectionsAfter.map(c => c.name);
    console.log(collectionNamesAfter);
    
    // Show the difference
    const removedCollections = collectionNamesBefore.filter(name => !collectionNamesAfter.includes(name));
    if (removedCollections.length > 0) {
      console.log('\n5. Collections removed during cleanup:');
      console.log(removedCollections);
    }
    
    console.log('\nComprehensive schema cleanup completed successfully!');
    
  } catch (error) {
    console.error('Error during comprehensive schema cleanup:', error);
  } finally {
    await dbManager.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  comprehensiveSchemaCleanup().catch(console.error);
}

export default comprehensiveSchemaCleanup;