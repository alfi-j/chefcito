import { NextResponse } from 'next/server';
import { dbManager } from '@/lib/mongodb';
import { User } from '@/models';

// PUT /api/users/[id] - Update user role
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { role, membership, status } = body;
    
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
    // Connect to database
    await dbManager.connect();
    const db = await dbManager.getDb();
    const usersCollection = db.collection('users');

    // Delete user
    const result = await usersCollection.deleteOne({ id: params.id });

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
    await dbManager.connect();
    
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