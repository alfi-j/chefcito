import { NextResponse } from 'next/server';
import { getPayPhoneService } from '@/services/payphone.service';

// POST /api/payments/payphone/webhook - Handle PayPhone webhook notifications
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const signature = request.headers.get('X-Signature');
    
    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Missing signature' },
        { status: 400 }
      );
    }

    const payPhoneService = getPayPhoneService();
    if (!payPhoneService) {
      return NextResponse.json(
        { success: false, error: 'PayPhone service not configured' },
        { status: 500 }
      );
    }

    // Validate webhook signature
    const isValid = payPhoneService.validateWebhookSignature(payload, signature);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Process the webhook event
    const { transactionId, status, clientTransactionId } = payload;
    
    console.log('PayPhone webhook received:', {
      transactionId,
      status,
      clientTransactionId
    });

    // Here you would typically:
    // 1. Update your order/payment records in the database
    // 2. Send notifications to the user
    // 3. Trigger any business logic based on the payment status

    // For now, we'll just log and return success
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error: any) {
    console.error('PayPhone webhook error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to process webhook' 
      },
      { status: 500 }
    );
  }
}