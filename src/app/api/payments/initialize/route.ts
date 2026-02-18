import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { amount, reference } = await request.json();

    // Validate required parameters
    if (!amount || !reference) {
      return NextResponse.json(
        { error: 'Amount and reference are required' },
        { status: 400 }
      );
    }

    // Server-side environment variables (secure)
    const token = process.env.PAYPHONE_TOKEN;
    const storeId = process.env.PAYPHONE_STORE_ID;

    if (!token || !storeId) {
      console.error('PayPhone credentials not configured');
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    // Return the secure configuration to the client
    return NextResponse.json({
      token,
      storeId,
      amount,
      reference,
      clientTransactionId: `subscription_${Date.now()}`,
      amountWithoutTax: amount,
      tax: 0,
      currency: "USD",
    });

  } catch (error) {
    console.error('Error initializing payment:', error);
    return NextResponse.json(
      { error: 'Failed to initialize payment' },
      { status: 500 }
    );
  }
}