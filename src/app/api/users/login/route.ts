import { NextResponse } from 'next/server';
import { User } from '@/models';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { debugAuth } from '@/lib/helpers';

export async function POST(request: Request) {
  try {
    debugAuth('POST: login request received');
    // Ensure mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
      debugAuth('POST: connecting to database with URI %s', MONGODB_URI);
      await mongoose.connect(MONGODB_URI);
    }
    
    const body = await request.json();
    const { email, password } = body;
    debugAuth('POST: attempting login for email %s', email);

    // Find user in User collection
    const user = await User.findOne({ email });
    
    if (!user) {
      debugAuth('POST: user not found for email %s', email);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check password - handle both hashed and plain text passwords for backward compatibility
    let isPasswordValid = false;
    
    // If password is hashed (contains bcrypt hash pattern)
    if (user.password && (user.password.startsWith('$2b$') || user.password.startsWith('$2a$') || user.password.startsWith('$2y$'))) {
      debugAuth('POST: comparing hashed password for user %s', email);
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      // Plain text password comparison (backward compatibility)
      debugAuth('POST: comparing plain text password for user %s', email);
      isPasswordValid = password === user.password;
    }
    
    if (!isPasswordValid) {
      debugAuth('POST: invalid password for user %s', email);
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
    debugAuth('POST: generated JWT token for user %s', email);

    // Return user without password and token
    const userObject = user.toObject();
    // @ts-ignore - password is required in the schema but we want to remove it from the response
    delete userObject.password;

    debugAuth('POST: login successful for user %s', email);
    return NextResponse.json({
      user: userObject,
      token
    });
  } catch (error) {
    debugAuth('POST: error during login process: %O', error);
    console.error('Error logging in:', error);
    return NextResponse.json(
      { error: 'Failed to log in' },
      { status: 500 }
    );
  }
}

// GET /api/users/login - Get user by email for refresh
export async function GET(request: Request) {
  try {
    debugAuth('GET: user refresh request received');
    // Ensure mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
      debugAuth('GET: connecting to database with URI %s', MONGODB_URI);
      await mongoose.connect(MONGODB_URI);
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    debugAuth('GET: fetching user with email %s', email);

    if (!email) {
      debugAuth('GET: email parameter missing');
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user in User collection
    const user = await User.findOne({ email });

    if (!user) {
      debugAuth('GET: user not found with email %s', email);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user without password
    const userObject = user.toObject();
    // @ts-ignore - password is required in the schema but we want to remove it from the response
    delete userObject.password;

    debugAuth('GET: successfully fetched user with email %s', email);
    return NextResponse.json(userObject);
  } catch (error) {
    debugAuth('GET: error fetching user: %O', error);
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}