
import { NextRequest, NextResponse } from 'next/server';
import { getOrders, addOrder, updateOrderItemStatus, updateOrderStatus, toggleOrderPin } from '@/lib/data';

export async function GET() {
  try {
    const orders = getOrders();
    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
    try {
        const orderData = await request.json();
        const newOrder = addOrder(orderData);
        return NextResponse.json(newOrder, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Error creating order: ' + error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { action, payload } = await request.json();

        if (action === 'updateItemStatus') {
            const success = updateOrderItemStatus(payload);
            if(success) return NextResponse.json({ success: true });
            return NextResponse.json({ error: 'Failed to update item status' }, { status: 400 });

        } else if (action === 'updateOrderStatus') {
            const success = updateOrderStatus(payload);
            if(success) return NextResponse.json({ success: true });
            return NextResponse.json({ error: 'Failed to update order status' }, { status: 400 });

        } else if (action === 'togglePin') {
            const success = toggleOrderPin(payload);
            if(success) return NextResponse.json({ success: true });
            return NextResponse.json({ error: 'Failed to toggle pin status' }, { status: 400 });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Error updating order: ' + error.message }, { status: 500 });
    }
}
