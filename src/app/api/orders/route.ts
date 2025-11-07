import { NextResponse } from 'next/server';
import { getInitialOrders, updateOrderStatus, addOrder, deleteOrder, updateOrder, toggleOrderPin, updateOrderItemStatus } from '@/lib/mongo-data-service';
import { getMenuItems } from '@/lib/mongo-data-service';
import { debugOrders } from '@/lib/debug-utils';

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

export async function GET(request: Request, { params }: { params?: { id: string } }) {
  debugOrders('GET: request received with params %O', params);
  // Handle GET /api/orders/[id] - get specific order
  if (params?.id) {
    try {
      const { id } = await params;
      debugOrders('GET: fetching specific order with id %s', id);
      
      if (!id) {
        debugOrders('GET: order ID is required');
        return NextResponse.json(
          createApiResponse(undefined, "Order ID is required"),
          { status: 400 }
        );
      }
      
      const orderId = parseInt(id);
      if (isNaN(orderId)) {
        debugOrders('GET: invalid order ID %s', id);
        return NextResponse.json(
          createApiResponse(undefined, "Invalid order ID"),
          { status: 400 }
        );
      }
      
      const menuItems = await getMenuItems();
      const orders = await getInitialOrders();
      const order = orders.find(o => o.id === orderId);
      
      if (!order) {
        debugOrders('GET: order not found with id %d', orderId);
        return NextResponse.json(
          createApiResponse(undefined, "Order not found"),
          { status: 404 }
        );
      }
      
      debugOrders('GET: successfully found order with id %d', orderId);
      return NextResponse.json(
        createApiResponse(order),
        { status: 200 }
      );
    } catch (error: any) {
      debugOrders('GET: error fetching order: %O', error);
      console.error('Error fetching order:', error);
      return NextResponse.json(
        createApiResponse(undefined, error.message || 'Failed to fetch order'),
        { status: 500 }
      );
    }
  }
  
  // Handle GET /api/orders - get all orders
  try {
    debugOrders('GET: fetching all orders');
    const menuItems = await getMenuItems();
    const orders = await getInitialOrders();
    debugOrders('GET: successfully fetched %d orders', orders.length);
    return NextResponse.json(
      createApiResponse(orders),
      { status: 200 }
    );
  } catch (error: any) {
    debugOrders('GET: error fetching orders: %O', error);
    console.error('Error fetching orders:', error);
    // Return appropriate HTTP status based on error type
    const status = error.message?.includes('Database connection failed') ? 503 : 500;
    return NextResponse.json(
      createApiResponse(undefined, error.message || 'Failed to fetch orders'),
      { status }
    );
  }
}

export async function POST(request: Request) {
  try {
    debugOrders('POST: creating new order');
    const orderData = await request.json();
    debugOrders('POST: order data %O', orderData);
    const newOrder = await addOrder(orderData);
    debugOrders('POST: successfully created order with id %d', newOrder.id);
    return NextResponse.json(
      createApiResponse(newOrder),
      { status: 201 }
    );
  } catch (error: any) {
    debugOrders('POST: error adding order: %O', error);
    console.error('Error adding order:', error);
    return NextResponse.json(
      createApiResponse(undefined, error.message || 'Failed to add order'),
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params?: { id: string } }) {
  debugOrders('PUT: request received with params %O', params);
  // Handle PUT /api/orders/[id] - update specific order
  if (params?.id) {
    try {
      const { id } = await params;
      const body = await request.json();
      debugOrders('PUT: updating order %s with data %O', id, body);
      
      if (!id) {
        debugOrders('PUT: order ID is required');
        return NextResponse.json(
          createApiResponse(undefined, "Order ID is required"),
          { status: 400 }
        );
      }
      
      const orderId = parseInt(id);
      if (isNaN(orderId)) {
        debugOrders('PUT: invalid order ID %s', id);
        return NextResponse.json(
          createApiResponse(undefined, "Invalid order ID"),
          { status: 400 }
        );
      }
      
      // Remove fields that should not be updated directly
      const { id: _, _id, __v, createdAt, ...updateData } = body;
      
      // Transform items data to match database structure
      if (updateData.items) {
        updateData.items = updateData.items.map((item: any) => ({
          ...item,
          menuItemId: item.menuItem?.id || item.menuItemId,
          selectedExtraIds: item.selectedExtras?.map((extra: any) => extra.id) || item.selectedExtraIds || []
        }));
      }
      
      const result = await updateOrder(orderId, updateData);
      
      if (!result) {
        debugOrders('PUT: order not found or could not be updated, id %d', orderId);
        return NextResponse.json(
          createApiResponse(undefined, "Order not found or could not be updated"),
          { status: 404 }
        );
      }
      
      debugOrders('PUT: successfully updated order %d', orderId);
      return NextResponse.json(
        createApiResponse({ success: true }),
        { status: 200 }
      );
    } catch (error: any) {
      debugOrders('PUT: error updating order: %O', error);
      console.error('Error updating order:', error);
      return NextResponse.json(
        createApiResponse(undefined, error.message || 'Failed to update order'),
        { status: 500 }
      );
    }
  }
  
  // Handle PUT /api/orders - update order status or item status
  try {
    const body = await request.json();
    debugOrders('PUT: updating order status with data %O', body);
    
    // Handle update item status
    if ('itemId' in body && 'status' in body) {
      const { orderId, itemId, status } = body;
      debugOrders('PUT: updating item %s status to %s in order %d', itemId, status, orderId);
      const result = await updateOrderItemStatus({ orderId, itemId, status });
      debugOrders('PUT: successfully updated item status');
      return NextResponse.json(
        createApiResponse(result),
        { status: 200 }
      );
    }
    
    // Handle update order status
    const { orderId, newStatus } = body;
    debugOrders('PUT: updating order %d status to %s', orderId, newStatus);
    await updateOrderStatus(orderId, newStatus);
    debugOrders('PUT: successfully updated order status');
    return NextResponse.json(
      createApiResponse({ success: true }),
      { status: 200 }
    );
  } catch (error: any) {
    debugOrders('PUT: error updating order status: %O', error);
    console.error('Error updating order status:', error);
    return NextResponse.json(
      createApiResponse(undefined, error.message || 'Failed to update order status'),
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: { params?: { id: string } }) {
  debugOrders('PATCH: request received with params %O', params);
  // Handle PATCH /api/orders/[id]/pin - toggle order pin
  if (params?.id) {
    try {
      const { id } = await params;
      debugOrders('PATCH: toggling pin for order %s', id);
      
      if (!id) {
        debugOrders('PATCH: order ID is required');
        return NextResponse.json(
          createApiResponse(undefined, "Order ID is required"),
          { status: 400 }
        );
      }
      
      const orderId = parseInt(id);
      if (isNaN(orderId)) {
        debugOrders('PATCH: invalid order ID %s', id);
        return NextResponse.json(
          createApiResponse(undefined, "Invalid order ID"),
          { status: 400 }
        );
      }
      
      const result = await toggleOrderPin({ orderId });
      
      if (!result.success) {
        debugOrders('PATCH: failed to toggle order pin for order %d', orderId);
        return NextResponse.json(
          createApiResponse(undefined, result.error || 'Failed to toggle order pin'),
          { status: 500 }
        );
      }
      
      debugOrders('PATCH: successfully toggled pin for order %d', orderId);
      return NextResponse.json(
        createApiResponse(result),
        { status: 200 }
      );
    } catch (error: any) {
      debugOrders('PATCH: error toggling order pin: %O', error);
      console.error('Error toggling order pin:', error);
      return NextResponse.json(
        createApiResponse(undefined, error.message || 'Failed to toggle order pin'),
        { status: 500 }
      );
    }
  }
  
  // Handle PATCH /api/orders - toggle order pin (legacy)
  try {
    const { orderId } = await request.json();
    debugOrders('PATCH: toggling pin for order (legacy) %d', orderId);
    const result = await toggleOrderPin({ orderId });
    
    if (!result.success) {
      debugOrders('PATCH: failed to toggle order pin for order %d', orderId);
      return NextResponse.json(
        createApiResponse(undefined, result.error || 'Failed to toggle order pin'),
        { status: 500 }
      );
    }
    
    debugOrders('PATCH: successfully toggled pin for order %d', orderId);
    return NextResponse.json(
      createApiResponse(result),
      { status: 200 }
    );
  } catch (error: any) {
    debugOrders('PATCH: error toggling order pin (legacy): %O', error);
    console.error('Error toggling order pin:', error);
    return NextResponse.json(
      createApiResponse(undefined, error.message || 'Failed to toggle order pin'),
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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