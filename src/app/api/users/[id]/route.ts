import { NextResponse } from 'next/server';
import { User } from '@/models';
import mongoose from 'mongoose';

// PUT /api/users/[id] - Update user role
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { role, membership, status } = body;
    
    // Ensure mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
      await mongoose.connect(MONGODB_URI);
    }

    // Update user
    const updatedUser = await User.findOneAndUpdate(
      { id: params.id },
      { 
        ...(role && { role }),
        ...(membership && { membership }),
        ...(status && { status })
      },
      { new: true }
    );
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove password from response
    const userObject = updatedUser.toObject();
    // @ts-ignore - password is required in the schema but we want to remove it from the response
    delete userObject.password;

    return NextResponse.json({
      success: true,
      user: userObject
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Ensure mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
      await mongoose.connect(MONGODB_URI);
    }

    // Delete user
    const result = await User.deleteOne({ id: params.id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

// GET /api/users/[id] - Get a specific user
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Ensure mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
      await mongoose.connect(MONGODB_URI);
    }
    
    const user = await User.findOne({ id: params.id });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove password from response
    const userObject = user.toObject();
    // @ts-ignore - password is required in the schema but we want to remove it from the response
    delete userObject.password;
    
    return NextResponse.json(userObject);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}