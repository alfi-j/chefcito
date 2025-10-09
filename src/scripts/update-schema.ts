import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { dbManager } from '../lib/mongodb';
import { User } from '../models';

async function updateSchema() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Loaded' : 'Not found');
    console.log('MONGODB_DB:', process.env.MONGODB_DB || 'Using default');
    
    await dbManager.connect();
    console.log('Connected to MongoDB successfully\n');

    const db = await dbManager.getDb();
    
    // 1. Check if users collection exists, if not create it
    console.log('1. Checking users collection...');
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (!collectionNames.includes('users')) {
      console.log('Creating users collection...');
      await db.createCollection('users');
    } else {
      console.log('Users collection already exists');
    }
    
    // 2. Migrate staff data to users collection if needed
    console.log('\n2. Checking if staff data needs to be migrated to users...');
    const staffCollection = db.collection('staff');
    const usersCollection = db.collection('users');
    
    const staffCount = await staffCollection.countDocuments();
    const usersCount = await usersCollection.countDocuments();
    
    console.log(`Staff documents: ${staffCount}`);
    console.log(`User documents: ${usersCount}`);
    
    if (staffCount > 0 && usersCount === 0) {
      console.log('Migrating staff data to users collection...');
      const staffMembers = await staffCollection.find({}).toArray();
      
      // Transform staff members to users
      const usersToInsert = staffMembers.map(staff => ({
        id: staff.id || staff._id.toString(),
        name: staff.name,
        email: staff.email,
        password: staff.password || 'defaultPassword123', // Default password, should be changed
        role: staff.role,
        status: staff.status || 'Off Shift',
        membership: staff.membership || 'free',
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      if (usersToInsert.length > 0) {
        await usersCollection.insertMany(usersToInsert);
        console.log(`Migrated ${usersToInsert.length} staff members to users collection`);
      }
    } else if (usersCount > 0) {
      console.log('Users collection already populated, skipping migration');
    }
    
    // 3. Update existing users to ensure they have all required fields
    console.log('\n3. Updating existing users with required fields...');
    const allUsers = await usersCollection.find({}).toArray();
    let updatedUsers = 0;
    
    for (const user of allUsers) {
      const updates: any = {};
      
      // Ensure all required fields exist
      if (user.password === undefined) {
        updates.password = 'defaultPassword123';
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
        updatedUsers++;
      }
    }
    
    console.log(`Updated ${updatedUsers} users with missing fields`);
    
    // 4. Add indexes for better performance
    console.log('\n4. Creating indexes...');
    try {
      await usersCollection.createIndex({ email: 1 }, { unique: true });
      console.log('Created unique index on email');
      
      await usersCollection.createIndex({ id: 1 }, { unique: true });
      console.log('Created unique index on id');
      
      await usersCollection.createIndex({ role: 1 });
      console.log('Created index on role');
    } catch (indexError) {
      console.log('Indexes may already exist, continuing...');
    }
    
    // 5. Show final statistics
    console.log('\n5. Final database statistics:');
    const finalUsersCount = await usersCollection.countDocuments();
    console.log(`Total users in database: ${finalUsersCount}`);
    
    if (finalUsersCount > 0) {
      const sampleUser = await usersCollection.findOne({});
      console.log('Sample user document:', JSON.stringify(sampleUser, null, 2));
    }
    
    console.log('\nDatabase schema update completed successfully!');
    
  } catch (error) {
    console.error('Error updating database schema:', error);
  } finally {
    await dbManager.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the schema update if this script is executed directly
if (require.main === module) {
  updateSchema().catch(console.error);
}

export default updateSchema;