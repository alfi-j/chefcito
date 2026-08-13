import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';

import User from '@/models/User';
import Restaurant from '@/models/Restaurant';
import { seedRestaurantData } from '@/lib/seed-data';

async function ensureDbConnection() {
  if (mongoose.connection.readyState !== 1) {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    await mongoose.connect(MONGODB_URI);
  }
}

// POST /api/auth/signup - Public self-service Owner signup
export async function POST(request: Request) {
  try {
    await ensureDbConnection();

    const body = await request.json();

    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(body.password, salt);

    const userId = uuidv4();
    const userData = {
      id: userId,
      name: body.name,
      email: body.email,
      password: hashedPassword,
      role: 'Owner',
      status: body.status || 'Off Shift',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const savedUser = new User(userData);
    await savedUser.save();

    if (body.role === 'Owner') {
      const restaurantId = uuidv4();
      const restaurant = new Restaurant({
        id: restaurantId,
        name: body.restaurantName || 'Mi Restaurante',
        ownerId: userId,
      });
      await restaurant.save();
      await seedRestaurantData(restaurantId);
      await User.updateOne({ id: userId }, { $set: { restaurantId, restaurantIds: [restaurantId] } });
    }

    const freshUser = await User.findOne({ id: userId });
    const userResponse = freshUser ? freshUser.toObject() : savedUser.toObject();
    delete userResponse.password;

    return NextResponse.json({
      success: true,
      user: userResponse
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create user' },
      { status: 500 }
    );
  }
}