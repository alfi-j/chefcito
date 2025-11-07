#!/usr/bin/env node

/**
 * Database Migration Script
 * 
 * This script ensures that all installations have the default "Kitchen" and "Completed" workstations.
 * It can be run on existing databases to add these workstations if they don't exist.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Import the Workstation model
import Workstation from './workstation.model.js';

// MongoDB connection configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'chefcito';

async function connectDB() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB
    });
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

async function ensureDefaultWorkstations() {
  try {
    console.log('Checking for default workstations...');
    
    // Check if "Kitchen" workstation exists
    const kitchenWorkstation = await Workstation.findOne({ name: 'Kitchen' });
    if (!kitchenWorkstation) {
      console.log('Creating "Kitchen" workstation...');
      
      // Get the highest position for proper ordering
      const workstations = await Workstation.find({}).sort({ position: -1 }).limit(1);
      const maxPosition = workstations.length > 0 ? workstations[0].position + 1 : 0;
      
      const kitchen = new Workstation({
        id: 'kitchen',
        name: 'Kitchen',
        states: {
          new: 'new',
          inProgress: 'in progress',
          ready: 'ready'
        },
        position: maxPosition
      });
      
      await kitchen.save();
      console.log('✅ "Kitchen" workstation created successfully');
    } else {
      console.log('✅ "Kitchen" workstation already exists');
    }
    
    // Check if "Completed" workstation exists
    const completedWorkstation = await Workstation.findOne({ name: 'Completed' });
    if (!completedWorkstation) {
      console.log('Creating "Completed" workstation...');
      
      // Get the highest position for proper ordering
      const workstations = await Workstation.find({}).sort({ position: -1 }).limit(1);
      const maxPosition = workstations.length > 0 ? workstations[0].position + 1 : 0;
      
      const completed = new Workstation({
        id: 'completed',
        name: 'Completed',
        states: {
          new: 'completed',
          inProgress: 'completed',
          ready: 'completed'
        },
        position: maxPosition
      });
      
      await completed.save();
      console.log('✅ "Completed" workstation created successfully');
    } else {
      console.log('✅ "Completed" workstation already exists');
    }
    
    console.log('✅ Default workstation check completed');
  } catch (error) {
    console.error('❌ Error ensuring default workstations:', error);
    process.exit(1);
  }
}

async function main() {
  console.log('🔧 ChefCito Default Workstations Setup');
  console.log('====================================');
  
  await connectDB();
  await ensureDefaultWorkstations();
  
  await mongoose.connection.close();
  console.log('🔒 Database connection closed');
  console.log('✨ Script execution completed');
}

// Run the script
main();