import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { dbManager } from '../lib/mongodb';
import { User } from '../models';

async function refactorSchema() {
  try {
    console.log('Connecting to MongoDB...');
    await dbManager.connect();
    console.log('Connected to MongoDB successfully\n');

    const db = await dbManager.getDb();
    
    // 1. Check collections
    console.log('1. Checking existing collections...');
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('Existing collections:', collectionNames);
    
    // 2. Refactor staff collection to users collection if needed
    if (collectionNames.includes('staff') && !collectionNames.includes('users')) {
      console.log('\n2. Renaming staff collection to users...');
      const staffCollection = db.collection('staff');
      const staffCount = await staffCollection.countDocuments();
      console.log(`Found ${staffCount} staff documents to migrate`);
      
      if (staffCount > 0) {
        // Rename the collection
        await db.renameCollection('staff', 'users');
        console.log('Renamed staff collection to users');
      }
    } else if (collectionNames.includes('staff') && collectionNames.includes('users')) {
      console.log('\n2. Merging staff and users collections...');
      const staffCollection = db.collection('staff');
      const usersCollection = db.collection('users');
      
      const staffCount = await staffCollection.countDocuments();
      const usersCount = await usersCollection.countDocuments();
      console.log(`Staff documents: ${staffCount}, Users documents: ${usersCount}`);
      
      if (staffCount > 0) {
        // Move staff documents to users collection
        const staffMembers = await staffCollection.find({}).toArray();
        console.log(`Migrating ${staffMembers.length} staff members to users collection`);
        
        // Filter out staff members that already exist in users collection
        for (const staff of staffMembers) {
          const existingUser = await usersCollection.findOne({ email: staff.email });
          if (!existingUser) {
            // Add required fields for users
            const userDoc = {
              ...staff,
              password: staff.password || 'defaultPassword123',
              createdAt: new Date(),
              updatedAt: new Date()
            };
            await usersCollection.insertOne(userDoc);
            console.log(`Migrated staff member: ${staff.name}`);
          } else {
            console.log(`Staff member ${staff.name} already exists as user, skipping`);
          }
        }
        
        // Drop the staff collection
        await db.dropCollection('staff');
        console.log('Dropped staff collection');
      }
    } else if (!collectionNames.includes('users')) {
      console.log('\n2. Creating users collection...');
      await db.createCollection('users');
      console.log('Created users collection');
    } else {
      console.log('\n2. Users collection already exists and is properly set up');
    }
    
    // 3. Ensure users collection has proper structure
    console.log('\n3. Updating users collection structure...');
    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    console.log(`Found ${userCount} user documents`);
    
    // Add missing fields to existing users
    const users = await usersCollection.find({}).toArray();
    let updatedCount = 0;
    
    for (const user of users) {
      const updates: any = {};
      
      // Ensure all required fields exist
      if (user.password === undefined) {
        updates.password = user.password || 'defaultPassword123';
      }
      
      if (user.status === undefined) {
        updates.status = 'Off Shift';
      }
      
      if (user.membership === undefined) {
        updates.membership = 'free';
      }
      
      if (user.createdAt === undefined) {
        updates.createdAt = new Date();
      }
      
      if (user.updatedAt === undefined) {
        updates.updatedAt = new Date();
      }
      
      // Apply updates if needed
      if (Object.keys(updates).length > 0) {
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: updates }
        );
        updatedCount++;
      }
    }
    
    console.log(`Updated ${updatedCount} user documents with missing fields`);
    
    // 4. Create proper indexes
    console.log('\n4. Creating indexes...');
    try {
      // Drop existing indexes first
      const existingIndexes = await usersCollection.indexes();
      for (const index of existingIndexes) {
        if (index.name !== '_id_' && index.name) { // Don't drop the default _id index
          try {
            await usersCollection.dropIndex(index.name);
            console.log(`Dropped index: ${index.name}`);
          } catch (error: any) {
            console.log(`Could not drop index ${index.name}:`, error.message);
          }
        }
      }
      
      // Create new proper indexes
      await usersCollection.createIndex({ email: 1 }, { unique: true });
      console.log('Created unique index on email');
      
      await usersCollection.createIndex({ id: 1 }, { unique: true });
      console.log('Created unique index on id');
      
      await usersCollection.createIndex({ role: 1 });
      console.log('Created index on role');
      
      await usersCollection.createIndex({ status: 1 });
      console.log('Created index on status');
      
      await usersCollection.createIndex({ membership: 1 });
      console.log('Created index on membership');
      
      await usersCollection.createIndex({ createdAt: 1 });
      console.log('Created index on createdAt');
    } catch (indexError: any) {
      console.log('Error creating indexes:', indexError.message);
    }
    
    // 5. Show final statistics
    console.log('\n5. Final database statistics:');
    const finalUsersCount = await usersCollection.countDocuments();
    console.log(`Total users in database: ${finalUsersCount}`);
    
    if (finalUsersCount > 0) {
      const sampleUser = await usersCollection.findOne({});
      console.log('Sample user document:');
      console.log(JSON.stringify(sampleUser, null, 2));
    }
    
    console.log('\nDatabase schema refactoring completed successfully!');
    
  } catch (error) {
    console.error('Error refactoring database schema:', error);
  } finally {
    await dbManager.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the schema refactoring if this script is executed directly
if (require.main === module) {
  refactorSchema().catch(console.error);
}

export default refactorSchema;