import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { dbManager } from '../lib/mongodb';

async function updateStaffRoles() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Loaded' : 'Not found');
    console.log('MONGODB_DB:', process.env.MONGODB_DB || 'Using default');
    
    await dbManager.connect();
    console.log('Connected to MongoDB successfully');

    // Get the staff collection
    const db = await dbManager.getDb();
    const staffCollection = db.collection('staff');
    
    // Find all staff members
    const staffMembers = await staffCollection.find({}).toArray();
    console.log(`Found ${staffMembers.length} staff members`);
    
    // Update roles - map old roles to new ones
    let updatedCount = 0;
    
    for (const staffMember of staffMembers) {
      let newRole = staffMember.role;
      let needsUpdate = false;
      
      // Map old roles to new roles
      switch (staffMember.role) {
        case 'Manager':
        case 'Chef':
        case 'Waiter':
          // These roles will now be classified as general Staff
          newRole = 'Staff';
          needsUpdate = true;
          break;
        case 'Owner':
          // Normalize role name
          newRole = 'Restaurant Owner';
          needsUpdate = true;
          break;
        default:
          // Keep Admin, Staff, and Restaurant Owner as is
          // For any other unexpected roles, default to Staff
          if (!['Admin', 'Staff', 'Restaurant Owner'].includes(staffMember.role)) {
            newRole = 'Staff';
            needsUpdate = true;
          }
      }
      
      // Ensure membership field exists
      if (staffMember.membership === undefined) {
        staffMember.membership = 'free';
        needsUpdate = true;
      }
      
      // Only update if role has changed or membership was missing
      if (needsUpdate) {
        console.log(`Updating staff member ${staffMember.name} from ${staffMember.role} to ${newRole}`);
        await staffCollection.updateOne(
          { _id: staffMember._id },
          { 
            $set: { 
              role: newRole,
              membership: staffMember.membership
            } 
          }
        );
        updatedCount++;
      }
    }
    
    console.log(`Updated ${updatedCount} staff members with new roles and membership fields`);
    console.log('Staff role update completed successfully!');
  } catch (error) {
    console.error('Error updating staff roles:', error);
  } finally {
    await dbManager.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the update if this script is executed directly
if (require.main === module) {
  updateStaffRoles().catch(console.error);
}

export default updateStaffRoles;