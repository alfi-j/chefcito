import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import User from '../../../models/User';
import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';

// POST /api/users - Create a new user
export async function POST(request: Request) {
  try {
    // Ensure mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
      await mongoose.connect(MONGODB_URI);
    }
    
    const body = await request.json();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: body.email });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(body.password, salt);
    
    // Generate a unique ID
    const userId = uuidv4();
    
    // Create new user object with all required fields
    const userData = {
      id: userId,
      name: body.name,
      email: body.email,
      password: hashedPassword,
      role: body.role,
      status: body.status || 'Off Shift',
      membership: body.membership || 'free',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Save to User collection
    const newUser = new User(userData);
    const savedUser = await newUser.save();
    
    return NextResponse.json({ 
      success: true, 
      userId: savedUser._id 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// GET /api/users - Get all users
export async function GET() {
  try {
    // Ensure mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
      await mongoose.connect(MONGODB_URI);
    }
    
    // Get users from User collection
    const users = await User.find({});
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}