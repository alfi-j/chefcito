import { NextResponse } from 'next/server';
import { User } from '@/models';
import { dbManager } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    await dbManager.connect();
    
    const body = await request.json();
    const { email, password } = body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
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