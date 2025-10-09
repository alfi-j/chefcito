import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Staff from '../models/Staff';

dotenv.config({ path: '.env.local' });

async function migrateStaffRoles() {
  try {
    console.log('Connecting to MongoDB...');
    
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chefcito';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB successfully');
    
    // Find all staff members
    const staffMembers = await Staff.find({});
    console.log(`Found ${staffMembers.length} staff members`);
    
    // Update roles - map old roles to new roles
    let updatedCount = 0;
    
    for (const staffMember of staffMembers) {
      let newRole = staffMember.role;
      let needsUpdate = false;
      
      // Map old roles to new roles
      switch (staffMember.role as string) {
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
      if (!staffMember.membership) {
        staffMember.membership = 'free';
        needsUpdate = true;
      }
      
      // Only update if role has changed or membership was missing
      if (needsUpdate) {
        console.log(`Updating staff member ${staffMember.name} from ${staffMember.role} to ${newRole}`);
        await Staff.findByIdAndUpdate(
          staffMember._id,
          { 
            role: newRole,
            membership: staffMember.membership
          }
        );
        updatedCount++;
      }
    }
    
    console.log(`Updated ${updatedCount} staff members with new roles and membership fields`);
    
    console.log('Staff role migration completed successfully!');
  } catch (error) {
    console.error('Error migrating staff roles:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateStaffRoles().catch(console.error);
}

export default migrateStaffRoles;