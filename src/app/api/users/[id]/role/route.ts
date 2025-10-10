import { NextResponse } from 'next/server';
import { User } from '@/models';
import mongoose from 'mongoose';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    // Ensure mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
      await mongoose.connect(MONGODB_URI);
    }
    
    const body = await request.json();
    const { role } = body;

    // Validate role
    const validRoles = ['Owner', 'Admin', 'Staff'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Update user role
    const updatedUser = await User.findOneAndUpdate(
      { id: params.id },
      { role },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return updated user without password
    const userObject = updatedUser.toObject();
    // @ts-ignore - password is required in the schema but we want to remove it from the response
    delete userObject.password;

    return NextResponse.json(userObject);
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}