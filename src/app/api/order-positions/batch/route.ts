import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// PUT /api/order-positions/batch
export async function PUT(request: Request) {
  try {
    const { tabName, positions } = await request.json();
    
    if (!tabName || !Array.isArray(positions)) {
      return NextResponse.json({ error: 'tabName and positions array are required' }, { status: 400 });
    }
    
    // Delete existing positions for this tab
    await query('DELETE FROM order_position WHERE tab_name = $1', [tabName]);
    
    // Insert new positions
    if (positions.length > 0) {
      // Build the values string and parameters correctly
      const values: string[] = [];
      const params: any[] = [tabName];
      
      positions.forEach((pos, index) => {
        values.push(`($1, $${index * 2 + 2}, $${index * 2 + 3})`);
        params.push(pos.orderId, pos.position);
      });
      
      const valuesString = values.join(', ');
      
      await query(
        `INSERT INTO order_position (tab_name, order_id, position) VALUES ${valuesString}`,
        params
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving order positions:', error);
    
    // Check if it's a foreign key constraint violation
    if (error.message && error.message.includes('foreign key constraint')) {
      return NextResponse.json({ error: 'One or more orders not found' }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to save order positions' }, { status: 500 });
  }
}