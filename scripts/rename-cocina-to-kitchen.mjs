#!/usr/bin/env node

/**
 * Database Migration Script
 * 
 * This script renames any existing "Cocina" workstations to "Kitchen".
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

async function renameCocinaToKitchen() {
  try {
    console.log('Checking for "Cocina" workstations to rename...');
    
    // Find all workstations named "Cocina"
    const cocinaWorkstations = await Workstation.find({ name: 'Cocina' });
    
    if (cocinaWorkstations.length === 0) {
      console.log('No "Cocina" workstations found to rename');
      return;
    }
    
    console.log(`Found ${cocinaWorkstations.length} "Cocina" workstation(s) to rename`);
    
    // Rename each "Cocina" workstation to "Kitchen"
    for (const workstation of cocinaWorkstations) {
      console.log(`Renaming workstation ID ${workstation.id} from "Cocina" to "Kitchen"`);
      workstation.name = 'Kitchen';
      await workstation.save();
      console.log(`✅ Renamed workstation ID ${workstation.id} to "Kitchen"`);
    }
    
    console.log('✅ Renaming completed');
  } catch (error) {
    console.error('❌ Error renaming workstations:', error);
    process.exit(1);
  }
}

async function main() {
  console.log('🔧 ChefCito Rename "Cocina" to "Kitchen" Script');
  console.log('==============================================');
  
  await connectDB();
  await renameCocinaToKitchen();
  
  await mongoose.connection.close();
  console.log('🔒 Database connection closed');
  console.log('✨ Script execution completed');
}

// Run the script
main();