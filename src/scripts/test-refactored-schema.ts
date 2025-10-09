import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { dbManager } from '../lib/mongodb';
import { User } from '../models';

async function testRefactoredSchema() {
  try {
    console.log('Testing refactored database schema...');
    await dbManager.connect();
    console.log('Connected to MongoDB successfully\n');

    const db = await dbManager.getDb();
    
    // 1. Check collections
    console.log('1. Checking collections...');
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('Available collections:', collectionNames);
    
    // 2. Test users collection
    if (collectionNames.includes('users')) {
      console.log('\n2. Testing users collection...');
      const usersCollection = db.collection('users');
      
      // Count documents
      const userCount = await usersCollection.countDocuments();
      console.log(`Total users: ${userCount}`);
      
      // Check indexes
      const indexes = await usersCollection.indexes();
      console.log('Indexes:');
      indexes.forEach(index => {
        console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
      });
      
      // Show sample document
      if (userCount > 0) {
        const sampleUser = await usersCollection.findOne({});
        console.log('\nSample user document:');
        console.log(JSON.stringify(sampleUser, null, 2));
      }
    } else {
      console.log('\n2. Users collection not found');
    }
    
    // 3. Test User model
    console.log('\n3. Testing User model...');
    const users = await User.find({}).limit(3);
    console.log(`Found ${users.length} users via Mongoose model`);
    
    if (users.length > 0) {
      const user: any = users[0];
      console.log('\nSample user from Mongoose model:');
      console.log(`  ID: ${user.id}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Status: ${user.status}`);
      console.log(`  Membership: ${user.membership}`);
      console.log(`  Created At: ${user.createdAt}`);
      console.log(`  Updated At: ${user.updatedAt}`);
    }
    
    // 4. Test password functionality
    console.log('\n4. Testing password functionality...');
    if (users.length > 0) {
      const user: any = users[0];
      if (user.password) {
        console.log('User has password field (hashed)');
        // Test password comparison (this should fail with a random password)
        try {
          const isMatch = await user.comparePassword('test123');
          console.log(`Password comparison result: ${isMatch}`);
        } catch (error) {
          console.log('Password comparison test completed');
        }
      } else {
        console.log('User document does not have password field');
      }
    }
    
    console.log('\nSchema test completed successfully!');
    
  } catch (error) {
    console.error('Error testing refactored schema:', error);
  } finally {
    await dbManager.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testRefactoredSchema().catch(console.error);
}

export default testRefactoredSchema;