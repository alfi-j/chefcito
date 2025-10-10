import { NextResponse } from 'next/server';
import { User } from '@/models';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    // Ensure mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
      await mongoose.connect(MONGODB_URI);
    }
    
    const body = await request.json();
    const { email, password } = body;

    // Find user in User collection
    const user = await User.findOne({ email });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check password - handle both hashed and plain text passwords for backward compatibility
    let isPasswordValid = false;
    
    // If password is hashed (contains bcrypt hash pattern)
    if (user.password && (user.password.startsWith('$2b$') || user.password.startsWith('$2a$') || user.password.startsWith('$2y$'))) {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      // Plain text password comparison (backward compatibility)
      isPasswordValid = password === user.password;
    }
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'chefcito_secret_key',
      { expiresIn: '24h' }
    );

    // Return user without password and token
    const userObject = user.toObject();
    // @ts-ignore - password is required in the schema but we want to remove it from the response
    delete userObject.password;

    return NextResponse.json({
      user: userObject,
      token
    });
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json(
      { error: 'Failed to log in' },
      { status: 500 }
    );
  }
}