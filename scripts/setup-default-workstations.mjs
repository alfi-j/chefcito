import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Import models
import Workstation from './workstation.model.js';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'chefcito';

// Connect to MongoDB
async function connectDB() {
  try {
    console.log('Connecting to MongoDB with URI:', MONGODB_URI);
    console.log('Using database:', MONGODB_DB);
    await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

// Setup default workstations
async function setupDefaultWorkstations() {
  try {
    // Check if default workstations already exist
    const kitchenWorkstation = await Workstation.findOne({ name: 'Kitchen' });
    const completedWorkstation = await Workstation.findOne({ name: 'Completed' });
    
    const defaultWorkstations = [];
    
    if (!kitchenWorkstation) {
      defaultWorkstations.push({
        id: 'kitchen',
        name: 'Kitchen', // Kitchen in English
        states: {
          new: 'new',
          inProgress: 'in progress',
          ready: 'ready'
        },
        position: 0
      });
    } else {
      console.log('"Kitchen" workstation already exists');
    }
    
    if (!completedWorkstation) {
      defaultWorkstations.push({
        id: 'completed',
        name: 'Completed',
        states: {
          new: 'completed',
          inProgress: 'completed',
          ready: 'completed'
        },
        position: 1
      });
    } else {
      console.log('"Completed" workstation already exists');
    }
    
    if (defaultWorkstations.length === 0) {
      console.log('Default workstations already exist in the database. Skipping setup.');
      return;
    }
    
    // Get the highest position value to add our workstations at the end
    const workstations = await Workstation.find({}).sort({ position: -1 }).limit(1);
    let maxPosition = workstations.length > 0 ? workstations[0].position : -1;
    
    // Create default workstations
    for (const wsData of defaultWorkstations) {
      maxPosition++;
      wsData.position = maxPosition;
      const workstation = new Workstation(wsData);
      await workstation.save();
      console.log(`Successfully added "${wsData.name}" workstation`);
    }
    
    console.log('Default workstations setup completed');
  } catch (error) {
    console.error('Error setting up default workstations:', error);
  }
}

// Main function
async function main() {
  await connectDB();
  await setupDefaultWorkstations();
  await mongoose.connection.close();
  console.log('Database connection closed');
}

main();