import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// GET /api/orders - Get all orders
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const client = await pool.connect();
    try {
      let query = `
        SELECT o.*, 
               json_agg(
                 json_build_object(
                   'id', oi.id,
                   'menuItemId', oi.menu_item_id,
                   'quantity', oi.quantity,
                   'newCount', oi.new_count,
                   'cookingCount', oi.cooking_count,
                   'readyCount', oi.ready_count,
                   'servedCount', oi.served_count,
                   'notes', oi.notes,
                   'selectedExtraIds', (
                     SELECT json_agg(oie.extra_menu_item_id)
                     FROM order_item_extras oie
                     WHERE oie.order_item_id = oi.id
                   ),
                   'menuItem', (
                     SELECT CASE 
                       WHEN mi.id IS NOT NULL THEN
                         json_build_object(
                           'id', mi.id,
                           'name', mi.name,
                           'price', mi.price,
                           'description', mi.description,
                           'available', mi.available,
                           'category', mi.category,
                           'imageUrl', mi.image_url,
                           'aiHint', mi.ai_hint,
                           'linkedModifiers', mi.linked_modifiers,
                           'sortIndex', mi.sort_index
                         )
                       ELSE NULL
                     END
                     FROM menu_items mi
                     WHERE mi.id = oi.menu_item_id
                   )
                 )
               ) FILTER (WHERE oi.id IS NOT NULL) as items,
               json_agg(
                 json_build_object(
                   'status', osh.status,
                   'timestamp', osh.timestamp
                 ) ORDER BY osh.timestamp
               ) FILTER (WHERE osh.id IS NOT NULL) as statusHistory
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN order_status_history osh ON o.id = osh.order_id
      `;
      const params: any[] = [];
      
      if (status) {
        query += ' WHERE o.status = $1';
        params.push(status);
      }
      
      query += ' GROUP BY o.id ORDER BY o.created_at DESC';
      
      const result = await client.query(query, params);
      
      // Transform the data to match the frontend structure
      const orders = result.rows.map(row => ({
        id: row.id,
        table: row.table_number,
        status: row.status,
        createdAt: row.created_at,
        completedAt: row.completed_at,
        isPinned: row.is_pinned,
        customerId: row.customer_id,
        staffName: row.staff_name,
        notes: row.notes,
        orderType: row.order_type,
        deliveryInfo: row.delivery_info,
        items: (row.items || []).map((item: any) => ({
          ...item,
          quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity,
          newCount: typeof item.newCount === 'string' ? parseFloat(item.newCount) : item.newCount,
          cookingCount: typeof item.cookingCount === 'string' ? parseFloat(item.cookingCount) : item.cookingCount,
          readyCount: typeof item.readyCount === 'string' ? parseFloat(item.readyCount) : item.readyCount,
          servedCount: typeof item.servedCount === 'string' ? parseFloat(item.servedCount) : item.servedCount,
        })),
        statusHistory: row.statushistory || [],
        updatedAt: row.updated_at
      }));
      
      return NextResponse.json(orders);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create a new order
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      table,
      items,
      notes,
      orderType,
      deliveryInfo,
      customerId,
      staffName,
      isPinned = false
    } = body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Insert the order
      const orderResult = await client.query(
        `INSERT INTO orders (
          table_number, status, notes, order_type, delivery_info, 
          customer_id, staff_name, is_pinned, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING *`,
        [
          table,
          'pending',
          notes || null,
          orderType,
          deliveryInfo ? JSON.stringify(deliveryInfo) : null,
          customerId || null,
          staffName || null,
          isPinned
        ]
      );
      
      const orderId = orderResult.rows[0].id;
      
      // Insert order items
      if (items && items.length > 0) {
        for (const item of items) {
          const itemResult = await client.query(
            `INSERT INTO order_items (
              id, order_id, menu_item_id, quantity, new_count, 
              cooking_count, ready_count, served_count, notes, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) RETURNING *`,
            [
              item.id || uuidv4(),
              orderId,
              item.menuItemId,
              item.quantity || 1,
              item.newCount || 0,
              item.cookingCount || 0,
              item.readyCount || 0,
              item.servedCount || 0,
              item.notes || null
            ]
          );
        }
      }
      
      await client.query('COMMIT');
      
      // Fetch the created order with all details
      const query = `
        SELECT o.*, 
               json_agg(
                 json_build_object(
                   'id', oi.id,
                   'menuItemId', oi.menu_item_id,
                   'quantity', oi.quantity,
                   'newCount', oi.new_count,
                   'cookingCount', oi.cooking_count,
                   'readyCount', oi.ready_count,
                   'servedCount', oi.served_count,
                   'notes', oi.notes,
                   'selectedExtraIds', (
                     SELECT json_agg(oie.extra_menu_item_id)
                     FROM order_item_extras oie
                     WHERE oie.order_item_id = oi.id
                   ),
                   'menuItem', (
                     SELECT CASE 
                       WHEN mi.id IS NOT NULL THEN
                         json_build_object(
                           'id', mi.id,
                           'name', mi.name,
                           'price', mi.price,
                           'description', mi.description,
                           'available', mi.available,
                           'category', mi.category,
                           'imageUrl', mi.image_url,
                           'aiHint', mi.ai_hint,
                           'linkedModifiers', mi.linked_modifiers,
                           'sortIndex', mi.sort_index
                         )
                       ELSE NULL
                     END
                     FROM menu_items mi
                     WHERE mi.id = oi.menu_item_id
                   )
                 )
               ) FILTER (WHERE oi.id IS NOT NULL) as items,
               json_agg(
                 json_build_object(
                   'status', osh.status,
                   'timestamp', osh.timestamp
                 ) ORDER BY osh.timestamp
               ) FILTER (WHERE osh.id IS NOT NULL) as statusHistory
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN order_status_history osh ON o.id = osh.order_id
        WHERE o.id = $1
        GROUP BY o.id
      `;
      
      const result = await client.query(query, [orderId]);
      const row = result.rows[0];
      
      // Transform the data to match the frontend structure
      const order = {
        id: row.id,
        table: row.table_number,
        status: row.status,
        createdAt: row.created_at,
        completedAt: row.completed_at,
        isPinned: row.is_pinned,
        customerId: row.customer_id,
        staffName: row.staff_name,
        notes: row.notes,
        orderType: row.order_type,
        deliveryInfo: row.delivery_info,
        items: (row.items || []).map((item: any) => ({
          ...item,
          quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity,
          newCount: typeof item.newCount === 'string' ? parseFloat(item.newCount) : item.newCount,
          cookingCount: typeof item.cookingCount === 'string' ? parseFloat(item.cookingCount) : item.cookingCount,
          readyCount: typeof item.readyCount === 'string' ? parseFloat(item.readyCount) : item.readyCount,
          servedCount: typeof item.servedCount === 'string' ? parseFloat(item.servedCount) : item.servedCount,
        })),
        statusHistory: row.statushistory || [],
        updatedAt: row.updated_at
      };
      
      return NextResponse.json(order);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}