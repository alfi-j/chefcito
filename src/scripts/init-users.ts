import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { dbManager } from '@/lib/mongodb';
import { User } from '@/models';

async function initUsers() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Loaded' : 'Not found');
    console.log('MONGODB_DB:', process.env.MONGODB_DB || 'Using default');
    
    await dbManager.connect();
    console.log('Connected to MongoDB successfully');

    // Check if users already exist
    const existingUsers = await User.find({});
    if (existingUsers.length > 0) {
      console.log(`Found ${existingUsers.length} existing users. Skipping initialization.`);
      return;
    }

    // Create default users
    console.log('Creating default users...');
    
    const defaultUsers = [
      {
        id: "1",
        name: "Restaurant Owner",
        email: "owner@chefcito.com",
        password: "owner123",
        role: "Owner",
        status: "On Shift",
        membership: "pro"
      },
      {
        id: "2",
        name: "Admin Staff",
        email: "admin@chefcito.com",
        password: "admin123",
        role: "Admin",
        status: "On Shift",
        membership: "pro"
      },
      {
        id: "3",
        name: "Regular Staff",
        email: "staff@chefcito.com",
        password: "staff123",
        role: "Staff",
        status: "On Shift",
        membership: "free"
      }
    ];

    for (const userData of defaultUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`Created user: ${user.name} (${user.email}) with role ${user.role}`);
    }

    console.log('User initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing users:', error);
  } finally {
    await dbManager.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the initialization if this script is executed directly
if (require.main === module) {
  initUsers().catch(console.error);
}

export default initUsers;