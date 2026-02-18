import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import Subscription from '@/models/Subscription';
import mongoose from 'mongoose';

// Helper function to ensure database connection
async function ensureDbConnection() {
  if (mongoose.connection.readyState !== 1) {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    await mongoose.connect(MONGODB_URI);
  }
}

// GET /api/subscriptions - Get user subscriptions
export async function GET(request: Request) {
  try {
    await ensureDbConnection();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const subscriptions = await Subscription.find({ userId }).sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: subscriptions
    });
  } catch (error: any) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch subscriptions' 
      },
      { status: 500 }
    );
  }
}

// POST /api/subscriptions - Create new subscription
export async function POST(request: Request) {
  try {
    await ensureDbConnection();
    
    const body = await request.json();
    const { 
      userId, 
      userEmail, 
      plan = 'pro',
      amount = 9.99,
      currency = 'USD',
      payphoneTransactionId 
    } = body;

    if (!userId || !userEmail) {
      return NextResponse.json(
        { success: false, error: 'userId and userEmail are required' },
        { status: 400 }
      );
    }

    // Calculate billing dates
    const startDate = new Date();
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1); // Monthly billing

    const subscriptionData = {
      id: `sub_${uuidv4()}`,
      userId,
      userEmail,
      plan,
      status: payphoneTransactionId ? 'active' : 'pending',
      payphoneTransactionId,
      startDate,
      nextBillingDate,
      amount,
      currency
    };

    const subscription = new Subscription(subscriptionData);
    await subscription.save();

    return NextResponse.json({
      success: true,
      data: subscription
    });
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create subscription' 
      },
      { status: 500 }
    );
  }
}