import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/order-positions?tabName=...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tabName = searchParams.get('tabName');
    
    if (!tabName) {
      return NextResponse.json({ error: 'tabName is required' }, { status: 400 });
    }
    
    const result = await query(
      `SELECT op.order_id, op.position 
       FROM order_position op
       JOIN orders o ON op.order_id = o.id
       WHERE op.tab_name = $1 
       ORDER BY op.position`,
      [tabName]
    );
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching order positions:', error);
    return NextResponse.json({ error: 'Failed to fetch order positions' }, { status: 500 });
  }
}

// POST /api/order-positions
export async function POST(request: Request) {
  try {
    const { tabName, orderId, position } = await request.json();
    
    if (!tabName || orderId === undefined || position === undefined) {
      return NextResponse.json({ error: 'tabName, orderId, and position are required' }, { status: 400 });
    }
    
    // Insert or update the order position
    const result = await query(
      `INSERT INTO order_position (tab_name, order_id, position) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (tab_name, order_id) 
       DO UPDATE SET position = $3, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [tabName, orderId, position]
    );
    
    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error saving order position:', error);
    
    // Check if it's a foreign key constraint violation
    if (error.message && error.message.includes('foreign key constraint')) {
      return NextResponse.json({ error: 'Order not found' }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to save order position' }, { status: 500 });
  }
}