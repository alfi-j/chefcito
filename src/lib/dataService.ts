
'use server'

import { createClient } from './supabase/server';
import { type Order, type MenuItem, type OrderItem } from './types';

// In a real app, you'd have more robust error handling
// and potentially more complex queries.

export async function getMenuItems(): Promise<MenuItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from('menu_items').select('*');
  if (error) {
    console.error('Error fetching menu items:', error);
    return [];
  }
  // This is a temporary mapping to match the frontend model.
  // In a real app, you'd likely adjust your frontend or DB schema.
  return data.map((item: any) => ({
    ...item,
    imageUrl: item.image_url,
    aiHint: item.ai_hint
  }));
}

export async function getOrders(): Promise<Order[]> {
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
        console.error('Error fetching orders:', ordersError);
        return [];
    }

    return ordersData.map((order: any) => ({
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
              ...item.menu_items,
              imageUrl: item.menu_items.image_url,
              aiHint: item.menu_items.ai_hint,
            }
        }))
    }));
}

export async function createOrder(order: Omit<Order, 'id' | 'createdAt' | 'status'> & { items: Omit<OrderItem, 'id' | 'menuItem'>[] }): Promise<Order | null> {
    const supabase = createClient();
    
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
        console.error('Error creating order:', orderError);
        return null;
    }

    const orderItemsToInsert = order.items.map(item => ({
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
        // You might want to delete the order here for consistency
        return null;
    }
    
    // This is not the full order object, but it's enough for the current implementation
    return { ...orderData, items: [] } as Order;
}


export async function updateOrderItemStatus(orderId: number, itemId: string, newStatus: 'New' | 'Cooking' | 'Cooked', newQuantity: number, newCookedCount: number): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('order_items')
    .update({ status: newStatus, quantity: newQuantity, cooked_count: newCookedCount })
    .eq('id', itemId);

  if (error) {
    console.error('Error updating item status:', error);
    return false;
  }
  return true;
}

export async function updateOrderStatus(orderId: number, newStatus: 'pending' | 'completed'): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId);
  
  if (error) {
    console.error('Error updating order status:', error);
    return false;
  }
  return true;
}


export async function toggleOrderPin(orderId: number, isPinned: boolean): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
        .from('orders')
        .update({ is_pinned: isPinned })
        .eq('id', orderId);
    
    if (error) {
        console.error('Error toggling pin status:', error);
        return false;
    }
    return true;
}

export async function addMenuItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('menu_items')
        .insert({
            name: item.name,
            price: item.price,
            category: item.category,
            image_url: item.imageUrl,
            ai_hint: item.aiHint,
        })
        .select()
        .single();
        
    if (error) {
        console.error('Error adding menu item:', error);
        return null;
    }
    return { ...data, imageUrl: data.image_url, aiHint: data.ai_hint };
}

export async function updateMenuItem(item: MenuItem): Promise<MenuItem | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('menu_items')
        .update({
            name: item.name,
            price: item.price,
            category: item.category,
            image_url: item.imageUrl,
            ai_hint: item.aiHint,
        })
        .eq('id', item.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating menu item:', error);
        return null;
    }
    return { ...data, imageUrl: data.image_url, aiHint: data.ai_hint };
}

export async function deleteMenuItem(itemId: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from('menu_items').delete().eq('id', itemId);
    if (error) {
        console.error('Error deleting menu item:', error);
        return false;
    }
    return true;
}
