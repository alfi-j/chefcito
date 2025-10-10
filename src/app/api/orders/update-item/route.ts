import { NextResponse } from 'next/server';
import { updateOrderItemStatus } from '@/lib/mongo-data-service';

export async function PUT(request: Request) {
  try {
    const { orderId, itemId, fromStatus, toStatus, updatedOrder } = await request.json();
    
    const result = await updateOrderItemStatus({ 
      orderId, 
      itemId, 
      fromStatus, 
      toStatus, 
      updatedOrder 
    });
    
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error updating order item status:', error);
    return NextResponse.json(
      { error: 'Failed to update order item status' },
      { status: 500 }
    );
  }
}