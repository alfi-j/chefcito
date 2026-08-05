import { NextResponse } from 'next/server';

import User from '../../../../models/User';
import Role from '../../../../models/Role';
import Restaurant from '../../../../models/Restaurant';
import mongoose from 'mongoose';

// Helper function to ensure database connection
async function ensureDbConnection() {
  if (mongoose.connection.readyState !== 1) {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    await mongoose.connect(MONGODB_URI);
  }
}

// GET /api/users/[id] - Get specific user
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureDbConnection();
    
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    const query = restaurantId ? { id, restaurantId } : { id };

    const user = await User.findOne(query);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Remove password from response
    const userObject = user.toObject();
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

// PUT /api/users/[id] - Update user
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureDbConnection();
    
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    const body = await request.json();
    
    if (!body.restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId is required' },
        { status: 400 }
      );
    }
    
    // Handle role update specifically
    if (body.action === 'updateRole') {
      const { role } = body;
      
      // Validate role against existing roles in database
      const existingRoles = await Role.find({});
      const validRoleNames = existingRoles.map((r: { name: string }) => r.name);
      
      if (!validRoleNames.includes(role)) {
        return NextResponse.json(
          { 
            success: false,
            error: `Invalid role: ${role}. Valid roles are: ${validRoleNames.join(', ')}` 
          },
          { status: 400 }
        );
      }
      
      // Update user role
      const updatedUser = await User.findOneAndUpdate(
        { id, restaurantId: body.restaurantId },
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
      delete userObject.password;
      
      return NextResponse.json({
        success: true,
        data: userObject
      });
    }
    
    // Handle active restaurant switch (single owner / admin, multiple restaurants)
    if (body.action === 'switchRestaurant') {
      const targetId = body.restaurantId;

      const user = await User.findOne({ id });
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const target = await Restaurant.findOne({ id: targetId });
      if (!target) {
        return NextResponse.json(
          { error: 'Restaurant not found' },
          { status: 404 }
        );
      }

      const isMember = (user.restaurantIds || []).includes(targetId);
      if (!isMember && user.role !== 'Owner') {
        return NextResponse.json(
          { error: 'Forbidden: you are not a member of this restaurant' },
          { status: 403 }
        );
      }

      user.restaurantId = targetId;
      user.restaurantIds = Array.from(new Set([...(user.restaurantIds || []), targetId]));
      await user.save();

      const userObject = user.toObject();
      delete userObject.password;

      return NextResponse.json({
        success: true,
        data: userObject
      });
    }

    // Update user general info
    const { role, status } = body;

    // Update user
    const updatedUser = await User.findOneAndUpdate(
      { id, restaurantId: body.restaurantId },
      {
        ...(role && { role }),
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
    delete userObject.password;
    
    return NextResponse.json({
      success: true,
      data: userObject
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureDbConnection();
    
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId is required' },
        { status: 400 }
      );
    }
    
    // Delete user
    const result = await User.deleteOne({ id, restaurantId });
    
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