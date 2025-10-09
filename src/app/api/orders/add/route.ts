import { NextResponse } from 'next/server';
import { addOrder } from '@/lib/mongo-data-service';

export async function POST(request: Request) {
  try {
    const orderData = await request.json();
    const newOrder = await addOrder(orderData);
    return NextResponse.json(newOrder);
  } catch (error) {
    console.error('Error adding order:', error);
    return NextResponse.json(
      { error: 'Failed to add order' },
      { status: 500 }
    );
  }
}