import { NextResponse } from 'next/server';
import { query } from '../lib/db';
import { Order } from '../lib/types';

// GET /api/orders - Get all orders
export async function GET() {
  try {
    const result = await query(`
      SELECT o.*, 
             json_agg(oi.*) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    
    // Process the results to match our Order type
    const orders = result.rows.map((row: any) => ({
      ...row,
      createdAt: row.created_at,
      completedAt: row.completed_at,
      isPinned: row.is_pinned,
      customerId: row.customer_id,
      staffName: row.staff_name,
      statusHistory: row.status_history,
      orderType: row.order_type,
      deliveryInfo: row.delivery_info,
      items: row.items[0] ? row.items : []
    }));
    
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST /api/orders - Create a new order
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { table, status, isPinned, customerId, staffName, statusHistory, notes, orderType, deliveryInfo, items } = body;

    // Create the order
    const orderResult = await query(
      `INSERT INTO orders 
       (table_number, status, is_pinned, customer_id, staff_name, status_history, notes, order_type, delivery_info) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [table, status, isPinned || false, customerId, staffName, JSON.stringify(statusHistory || []), notes, orderType, JSON.stringify(deliveryInfo)]
    );

    const order = orderResult.rows[0];

    // Create order items if provided
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await query(
          `INSERT INTO order_items 
           (id, order_id, menu_item_id, quantity, new_count, cooking_count, ready_count, served_count, selected_extras, split_id, notes) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            item.id,
            order.id,
            item.menuItem?.id, // Fix: use item.menuItem.id instead of item.menuItemId
            item.quantity,
            item.newCount || 0,
            item.cookingCount || 0,
            item.readyCount || 0,
            item.servedCount || 0,
            JSON.stringify(item.selectedExtras || []),
            item.splitId,
            item.notes
          ]
        );
      }
    }

    // Return the created order with items
    const result = await query(`
      SELECT o.*, 
             json_agg(oi.*) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1
      GROUP BY o.id
    `, [order.id]);
    
    const orderWithItems = {
      ...result.rows[0],
      createdAt: result.rows[0].created_at,
      completedAt: result.rows[0].completed_at,
      isPinned: result.rows[0].is_pinned,
      customerId: result.rows[0].customer_id,
      staffName: result.rows[0].staff_name,
      statusHistory: result.rows[0].status_history,
      orderType: result.rows[0].order_type,
      deliveryInfo: result.rows[0].delivery_info,
      items: result.rows[0].items[0] ? result.rows[0].items : []
    };

    return NextResponse.json(orderWithItems, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

// PUT /api/orders/:id - Update an order
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { table, status, isPinned, customerId, staffName, statusHistory, notes, orderType, deliveryInfo, items } = body;

    // Update the order
    await query(
      `UPDATE orders SET 
        table_number = $1, 
        status = $2, 
        is_pinned = $3, 
        customer_id = $4, 
        staff_name = $5, 
        status_history = $6, 
        notes = $7,
        order_type = $8,
        delivery_info = $9
       WHERE id = $10`,
      [table, status, isPinned || false, customerId, staffName, JSON.stringify(statusHistory || []), notes, orderType, JSON.stringify(deliveryInfo), id]
    );

    // Update order items if provided
    if (items && Array.isArray(items)) {
      // First, delete existing items for this order
      await query('DELETE FROM order_items WHERE order_id = $1', [id]);
      
      // Then insert the new items
      for (const item of items) {
        await query(
          `INSERT INTO order_items 
           (id, order_id, menu_item_id, quantity, new_count, cooking_count, ready_count, served_count, selected_extras, split_id, notes) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            item.id,
            id,
            item.menuItem?.id, // Fix: use item.menuItem.id instead of item.menuItemId
            item.quantity,
            item.newCount || 0,
            item.cookingCount || 0,
            item.readyCount || 0,
            item.servedCount || 0,
            JSON.stringify(item.selectedExtras || []),
            item.splitId,
            item.notes
          ]
        );
      }
    }

    // Return the updated order
    const result = await query(`
      SELECT o.*, 
             json_agg(oi.*) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1
      GROUP BY o.id
    `, [id]);
    
    const orderWithItems = {
      ...result.rows[0],
      createdAt: result.rows[0].created_at,
      completedAt: result.rows[0].completed_at,
      isPinned: result.rows[0].is_pinned,
      customerId: result.rows[0].customer_id,
      staffName: result.rows[0].staff_name,
      statusHistory: result.rows[0].status_history,
      orderType: result.rows[0].order_type,
      deliveryInfo: result.rows[0].delivery_info,
      items: result.rows[0].items[0] ? result.rows[0].items : []
    };

    return NextResponse.json(orderWithItems);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

// DELETE /api/orders/:id - Delete an order
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Delete order items first (due to foreign key constraint)
    await query('DELETE FROM order_items WHERE order_id = $1', [id]);
    
    // Delete the order
    const result = await query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);
    
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}