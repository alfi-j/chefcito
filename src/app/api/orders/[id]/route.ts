import { NextResponse } from 'next/server';
import { deleteOrder } from '@/lib/database-service';
import { debugOrders } from '@/lib/helpers';

// Define response structure
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// Helper function to create standardized API responses
function createApiResponse<T>(data?: T, error?: string): ApiResponse<T> {
  return {
    success: !error,
    data,
    error,
    timestamp: new Date().toISOString()
  };
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> } = { params: Promise.resolve({ id: '' }) }) {
  const { params } = await context;
  try {
    const { id } = await params;
    debugOrders('DELETE: deleting order %s', id);
    
    if (!id) {
      debugOrders('DELETE: order ID is required');
      return NextResponse.json(
        createApiResponse(undefined, "Order ID is required"),
        { status: 400 }
      );
    }
    
    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      debugOrders('DELETE: invalid order ID %s', id);
      return NextResponse.json(
        createApiResponse(undefined, "Invalid order ID"),
        { status: 400 }
      );
    }
    
    const result = await deleteOrder(orderId);
    
    if (!result) {
      debugOrders('DELETE: order not found or could not be deleted, id %d', orderId);
      return NextResponse.json(
        createApiResponse(undefined, "Order not found or could not be deleted"),
        { status: 404 }
      );
    }
    
    debugOrders('DELETE: successfully deleted order %d', orderId);
    return NextResponse.json(
      createApiResponse({ success: true }),
      { status: 200 }
    );
  } catch (error: any) {
    debugOrders('DELETE: error deleting order: %O', error);
    console.error('Error deleting order:', error);
    return NextResponse.json(
      createApiResponse(undefined, error.message || 'Failed to delete order'),
      { status: 500 }
    );
  }
}