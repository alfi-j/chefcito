import { NextResponse } from 'next/server';
import { getInitialOrders, updateOrderStatus, toggleOrderPin } from '@/lib/mongo-data-service';
import { getMenuItems } from '@/lib/mongo-data-service';

export async function GET() {
  try {
    const menuItems = await getMenuItems();
    const orders = await getInitialOrders(menuItems);
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { orderId, newStatus } = await request.json();
    await updateOrderStatus({ orderId, newStatus });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { orderId, isPinned } = await request.json();
    await toggleOrderPin({ orderId, isPinned });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error toggling order pin:', error);
    return NextResponse.json(
      { error: 'Failed to toggle order pin' },
      { status: 500 }
    );
  }
}