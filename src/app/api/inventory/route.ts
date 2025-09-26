import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const client = await pool.connect();
    
    try {
      const result = await client.query('SELECT * FROM inventory_items ORDER BY name');
      
      const inventoryItems = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        quantity: typeof row.quantity === 'string' ? parseFloat(row.quantity) : row.quantity,
        unit: row.unit,
        reorderThreshold: typeof row.reorder_threshold === 'string' ? parseFloat(row.reorder_threshold) : row.reorder_threshold,
        lastRestocked: row.last_restocked,
        linkedItemIds: row.linked_item_ids,
        category: row.category,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      
      return NextResponse.json(inventoryItems);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory items' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        `INSERT INTO inventory_items 
         (id, name, quantity, unit, reorder_threshold, last_restocked, linked_item_ids, category)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          body.id || `inventory-${Date.now()}`,
          body.name,
          typeof body.quantity === 'string' ? parseFloat(body.quantity) : body.quantity || 0,
          body.unit || '',
          typeof body.reorderThreshold === 'string' ? parseFloat(body.reorderThreshold) : body.reorderThreshold || 0,
          body.lastRestocked || null,
          body.linkedItemIds || [],
          body.category || ''
        ]
      );
      
      const inventoryItem = result.rows[0];
      
      const transformedItem = {
        id: inventoryItem.id,
        name: inventoryItem.name,
        quantity: typeof inventoryItem.quantity === 'string' ? parseFloat(inventoryItem.quantity) : inventoryItem.quantity,
        unit: inventoryItem.unit,
        reorderThreshold: typeof inventoryItem.reorder_threshold === 'string' ? parseFloat(inventoryItem.reorder_threshold) : inventoryItem.reorder_threshold,
        lastRestocked: inventoryItem.last_restocked,
        linkedItemIds: inventoryItem.linked_item_ids,
        category: inventoryItem.category,
        createdAt: inventoryItem.created_at,
        updatedAt: inventoryItem.updated_at
      };
      
      return NextResponse.json(transformedItem);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to create inventory item' },
      { status: 500 }
    );
  }
}