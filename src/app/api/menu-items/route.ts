import { NextResponse } from 'next/server';
import { query } from '../lib/db';
import { MenuItem } from '../lib/types';

// GET /api/menu-items - Get all menu items
export async function GET() {
  try {
    const result = await query('SELECT * FROM menu_items ORDER BY sort_index');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
  }
}

// POST /api/menu-items - Create a new menu item
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, price, description, available, category, imageUrl, aiHint, linkedModifiers, sortIndex } = body;

    const result = await query(
      `INSERT INTO menu_items 
       (id, name, price, description, available, category, image_url, ai_hint, linked_modifiers, sort_index) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [id, name, price, description, available !== undefined ? available : true, category, imageUrl, aiHint, linkedModifiers || [], sortIndex || 0]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating menu item:', error);
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 });
  }
}

// PUT /api/menu-items/:id - Update a menu item
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Menu item ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, price, description, available, category, imageUrl, aiHint, linkedModifiers, sortIndex } = body;

    const result = await query(
      `UPDATE menu_items 
       SET name = $1, price = $2, description = $3, available = $4, category = $5, 
           image_url = $6, ai_hint = $7, linked_modifiers = $8, sort_index = $9
       WHERE id = $10 RETURNING *`,
      [name, price, description, available, category, imageUrl, aiHint, linkedModifiers, sortIndex, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating menu item:', error);
    return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 });
  }
}

// DELETE /api/menu-items/:id - Delete a menu item
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Menu item ID is required' }, { status: 400 });
    }

    const result = await query('DELETE FROM menu_items WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 });
  }
}