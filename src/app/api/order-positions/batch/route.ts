import { NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';

// PUT /api/order-positions/batch
export async function PUT(request: Request) {
  const dbClient = await pool.connect();
  
  try {
    await dbClient.query('BEGIN');
    
    const { tabName, positions } = await request.json();
    
    if (!tabName || !Array.isArray(positions)) {
      await dbClient.query('ROLLBACK');
      dbClient.release();
      return NextResponse.json({ error: 'tabName and positions array are required' }, { status: 400 });
    }
    
    // Validate that all order IDs exist before proceeding
    if (positions.length > 0) {
      const orderIds = positions.map(pos => pos.orderId);
      
      const orderCheck = await dbClient.query(
        `SELECT id FROM orders WHERE id = ANY($1)`,
        [orderIds]
      );
      
      const existingOrderIds = new Set(orderCheck.rows.map((row: any) => row.id));
      const missingOrderIds = orderIds.filter(id => !existingOrderIds.has(id));
      
      if (missingOrderIds.length > 0) {
        console.warn(`Attempted to save positions for non-existent orders: ${missingOrderIds.join(', ')}`);
        // Filter out positions for non-existent orders
        const validPositions = positions.filter(pos => existingOrderIds.has(pos.orderId));
        
        // If no valid positions remain, return success (nothing to do)
        if (validPositions.length === 0) {
          await dbClient.query('COMMIT');
          dbClient.release();
          return NextResponse.json({ success: true });
        }
        
        // Continue with only valid positions
        positions.splice(0, positions.length, ...validPositions);
      }
    }
    
    // Instead of DELETE + INSERT, use UPSERT (INSERT ... ON CONFLICT)
    if (positions.length > 0) {
      // First, delete positions for orders that are not in the new set
      const orderIds = positions.map(pos => pos.orderId);
      await dbClient.query(
        `DELETE FROM order_position 
         WHERE tab_name = $1 
         AND order_id != ALL($2)`,
        [tabName, orderIds]
      );
      
      // Then upsert the new positions
      for (const pos of positions) {
        await dbClient.query(
          `INSERT INTO order_position (tab_name, order_id, position) 
           VALUES ($1, $2, $3)
           ON CONFLICT (tab_name, order_id) 
           DO UPDATE SET position = $3, updated_at = CURRENT_TIMESTAMP`,
          [tabName, pos.orderId, pos.position]
        );
      }
    } else {
      // If no positions, delete all for this tab
      await dbClient.query('DELETE FROM order_position WHERE tab_name = $1', [tabName]);
    }
    
    await dbClient.query('COMMIT');
    dbClient.release();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    await dbClient.query('ROLLBACK');
    dbClient.release();
    console.error('Error saving order positions:', error);
    
    // Check if it's a foreign key constraint violation
    if (error.message && (error.message.includes('foreign key constraint') || error.message.includes('violates foreign key constraint'))) {
      return NextResponse.json({ 
        error: 'One or more orders not found',
        message: 'One or more orders not found. Please make sure all orders exist in the database before saving positions.'
      }, { status: 400 });
    }
    
    // Handle duplicate key constraint violation
    if (error.code === '23505') {
      return NextResponse.json({ 
        error: 'Conflict detected while saving positions',
        message: 'A conflict occurred while saving positions. This may be due to simultaneous updates. Please try again.'
      }, { status: 409 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to save order positions',
      message: error.message || 'An unexpected error occurred while saving order positions'
    }, { status: 500 });
  }
}