import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import Subscription from '@/models/Subscription';
import { initializePayPhone, getPayPhoneService } from '@/services/payphone.service';
import mongoose from 'mongoose';

// Helper function to ensure database connection
async function ensureDbConnection() {
  if (mongoose.connection.readyState !== 1) {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    await mongoose.connect(MONGODB_URI);
  }
}

// Initialize PayPhone service
const payPhoneConfig = {
  clientId: process.env.PAYPHONE_CLIENT_ID || '',
  clientSecret: process.env.PAYPHONE_CLIENT_SECRET || '',
  baseUrl: process.env.PAYPHONE_BASE_URL || 'https://pay.payphone.ec',
  merchantId: process.env.PAYPHONE_MERCHANT_ID || undefined
};

if (payPhoneConfig.clientId && payPhoneConfig.clientSecret) {
  try {
    initializePayPhone(payPhoneConfig);
  } catch (error) {
    console.warn('PayPhone Cajita de Pagos not properly configured:', error);
  }
}

// POST /api/membership/subscribe - Process membership subscription payment
export async function POST(request: Request) {
  try {
    await ensureDbConnection();
    
    const body = await request.json();
    const { 
      userId, 
      userEmail, 
      amount = 9.99,
      currency = 'USD',
      phoneNumber,
      email 
    } = body;

    if (!userId || !userEmail) {
      return NextResponse.json(
        { success: false, error: 'userId and userEmail are required' },
        { status: 400 }
      );
    }

    if (!phoneNumber && !email) {
      return NextResponse.json(
        { success: false, error: 'Either phone number or email is required' },
        { status: 400 }
      );
    }

    // Process payment through PayPhone
    const payPhoneService = getPayPhoneService();
    if (!payPhoneService) {
      return NextResponse.json(
        { success: false, error: 'PayPhone service not configured' },
        { status: 500 }
      );
    }

    const transaction = await payPhoneService.createTransaction({
      amount: parseFloat(amount),
      currency,
      clientTransactionId: `subscription_${userId}_${Date.now()}`,
      description: 'ChefCito Pro Monthly Subscription',
      phoneNumber: phoneNumber || undefined,
      email: email || undefined
    });

    // Calculate billing dates
    const startDate = new Date();
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1); // Monthly billing

    // Create subscription record
    const subscriptionData = {
      id: `sub_${uuidv4()}`,
      userId,
      userEmail,
      plan: 'pro',
      status: 'active', // Assume successful payment
      payphoneTransactionId: transaction.transactionId,
      startDate,
      nextBillingDate,
      amount: parseFloat(amount),
      currency
    };

    const subscription = new Subscription(subscriptionData);
    await subscription.save();

    return NextResponse.json({
      success: true,
      data: {
        subscription,
        transaction
      },
      message: 'Subscription created successfully'
    });

  } catch (error: any) {
    console.error('Membership subscription error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to process subscription' 
      },
      { status: 500 }
    );
  }
}