
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();
  const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select(`
          *,
          order_items (
              *,
              menu_items (*)
          )
      `)
      .order('created_at', { ascending: false });

  if (ordersError) {
      return NextResponse.json({ error: 'Error fetching orders: ' + ordersError.message }, { status: 500 });
  }

  const orders = ordersData.map((order: any) => ({
      id: order.id,
      table: order.table_number,
      status: order.status,
      createdAt: new Date(order.created_at),
      isPinned: order.is_pinned,
      items: order.order_items.map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          cookedCount: item.cooked_count,
          status: item.status,
          menuItem: {
            id: item.menu_items.id,
            name: item.menu_items.name,
            price: item.menu_items.price,
            category: item.menu_items.category,
            imageUrl: item.menu_items.image_url,
            aiHint: item.menu_items.ai_hint,
          }
      }))
  }));
  
  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
    const supabase = createClient();
    const order = await request.json();

    const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
            table_number: order.table,
            status: 'pending',
            is_pinned: false,
        })
        .select()
        .single();

    if (orderError) {
        return NextResponse.json({ error: 'Error creating order: ' + orderError.message }, { status: 500 });
    }

    const orderItemsToInsert = order.items.map((item: any) => ({
        order_id: orderData.id,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        cooked_count: 0,
        status: 'New',
    }));

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert);

    if (itemsError) {
        console.error('Error creating order items:', itemsError);
        return NextResponse.json({ error: 'Error creating order items: ' + itemsError.message }, { status: 500 });
    }
    
    // This is not the full order object, but it's enough for the current implementation
    return NextResponse.json({ ...orderData, items: [] }, { status: 201 });
}

export async function PUT(request: NextRequest) {
    const supabase = createClient();
    const { action, payload } = await request.json();

    if (action === 'updateItemStatus') {
        const { itemId, newStatus, newQuantity, newCookedCount } = payload;
        const { error } = await supabase
            .from('order_items')
            .update({ status: newStatus, quantity: newQuantity, cooked_count: newCookedCount })
            .eq('id', itemId);

        if (error) {
            return NextResponse.json({ error: 'Error updating item status: ' + error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true });

    } else if (action === 'updateOrderStatus') {
        const { orderId, newStatus } = payload;
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);
        
        if (error) {
            return NextResponse.json({ error: 'Error updating order status: ' + error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true });

    } else if (action === 'togglePin') {
        const { orderId, isPinned } = payload;
        const { error } = await supabase
            .from('orders')
            .update({ is_pinned: isPinned })
            .eq('id', orderId);
        
        if (error) {
            return NextResponse.json({ error: 'Error toggling pin status: ' + error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
