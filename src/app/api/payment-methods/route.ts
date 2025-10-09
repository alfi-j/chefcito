import { NextResponse } from 'next/server';
import { getPaymentMethods } from '@/lib/mongo-data-service';

export async function GET() {
  try {
    const paymentMethods = await getPaymentMethods();
    return NextResponse.json(paymentMethods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}