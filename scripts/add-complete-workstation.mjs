import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Debug environment variables
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('MONGODB_DB:', process.env.MONGODB_DB);

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

// Add the default "Completed" workstation
async function addCompleteWorkstation() {
  try {
    // Check if "Completed" workstation already exists
    const existingWorkstation = await Workstation.findOne({ name: 'Completed' });
    
    if (existingWorkstation) {
      console.log('Completed workstation already exists');
      return;
    }
    
    // Get the highest position value and add 1
    const workstations = await Workstation.find({}).sort({ position: -1 }).limit(1);
    const maxPosition = workstations.length > 0 ? workstations[0].position + 1 : 0;
    
    // Create the "Completed" workstation
    const completeWorkstation = new Workstation({
      id: 'completed',
      name: 'Completed',
      states: {
        new: 'completed',
        inProgress: 'completed',
        ready: 'completed'
      },
      position: maxPosition
    });
    
    await completeWorkstation.save();
    console.log('Successfully added "Completed" workstation');
  } catch (error) {
    console.error('Error adding "Completed" workstation:', error);
  }
}

// Main function
async function main() {
  await connectDB();
  await addCompleteWorkstation();
  await mongoose.connection.close();
  console.log('Database connection closed');
}

main();