import { NextResponse } from 'next/server';
import { dbManager } from '@/lib/mongodb';

// POST /api/users - Create a new user
export async function POST(request: Request) {
  try {
    await dbManager.connect();
    const db = await dbManager.getDb();
    const collection = db.collection('users');
    
    const body = await request.json();
    
    // Check if user already exists
    const existingUser = await collection.findOne({ email: body.email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // Create new user
    const result = await collection.insertOne({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return NextResponse.json({ 
      success: true, 
      userId: result.insertedId 
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
    await dbManager.connect();
    const db = await dbManager.getDb();
    const collection = db.collection('users');
    
    const users = await collection.find({}).toArray();
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}