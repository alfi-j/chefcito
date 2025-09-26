import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// GET /api/orders/{id} - Get a single order with its items
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params before accessing its properties
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
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
      
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }
      
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
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PUT /api/orders/{id} - Update an order (e.g., status)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params before accessing its properties
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { 
      status,
      table,
      notes,
      orderType,
      deliveryInfo,
      customerId,
      staffName,
      isPinned
    } = body;

    const client = await pool.connect();
    try {
      // Build the update query dynamically based on provided fields
      let query = 'UPDATE orders SET ';
      const updates = [];
      const values = [];
      let index = 1;
      
      if (status !== undefined) {
        updates.push(`status = $${index}`);
        values.push(status);
        index++;
        
        // Update completed_at if status is completed
        if (status === 'completed') {
          updates.push(`completed_at = $${index}`);
          values.push(new Date().toISOString());
          index++;
        }
        
        // Add to status history
        await client.query(
          `INSERT INTO order_status_history (order_id, status) VALUES ($1, $2)`,
          [id, status]
        );
      }
      
      if (table !== undefined) {
        updates.push(`table_number = $${index}`);
        values.push(table);
        index++;
      }
      
      if (notes !== undefined) {
        updates.push(`notes = $${index}`);
        values.push(notes);
        index++;
      }
      
      if (orderType !== undefined) {
        updates.push(`order_type = $${index}`);
        values.push(orderType);
        index++;
      }
      
      if (deliveryInfo !== undefined) {
        updates.push(`delivery_info = $${index}`);
        values.push(JSON.stringify(deliveryInfo));
        index++;
      }
      
      if (customerId !== undefined) {
        updates.push(`customer_id = $${index}`);
        values.push(customerId);
        index++;
      }
      
      if (staffName !== undefined) {
        updates.push(`staff_name = $${index}`);
        values.push(staffName);
        index++;
      }
      
      if (isPinned !== undefined) {
        updates.push(`is_pinned = $${index}`);
        values.push(isPinned);
        index++;
      }
      
      // Add updated_at
      updates.push(`updated_at = $${index}`);
      values.push(new Date().toISOString());
      index++;
      
      query += updates.join(', ');
      query += ` WHERE id = $${index} RETURNING *`;
      values.push(id);
      
      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }
      
      const orderRow = result.rows[0];
      
      // Transform the data to match the frontend structure
      const transformedOrder = {
        id: orderRow.id,
        table: orderRow.table_number,
        status: orderRow.status,
        createdAt: orderRow.created_at,
        completedAt: orderRow.completed_at,
        isPinned: orderRow.is_pinned,
        customerId: orderRow.customer_id,
        staffName: orderRow.staff_name,
        notes: orderRow.notes,
        orderType: orderRow.order_type,
        deliveryInfo: orderRow.delivery_info,
        updatedAt: orderRow.updated_at
      };
      
      return NextResponse.json(transformedOrder);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/{id} - Delete an order
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params before accessing its properties
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // Delete the order (cascading will handle related records)
      const result = await client.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ message: 'Order deleted successfully' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}