import { NextResponse } from 'next/server';
<<<<<<< HEAD
import { query } from '../lib/db';
import { MenuItem } from '../lib/types';

// Helper function to create a JSON response
function createResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
=======
import { pool } from '@/lib/db';
>>>>>>> d3399ff (Chefcito Beta!)

// GET /api/menu-items - Get all menu items
export async function GET() {
  try {
<<<<<<< HEAD
    const result = await query('SELECT * FROM menu_items ORDER BY sort_index');
    // Ensure price is parsed as a number
    const menuItems = result.rows.map((item: any) => ({
      ...item,
      price: typeof item.price === 'string' ? parseFloat(item.price) : item.price
    }));
    return createResponse(menuItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
=======
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM menu_items ORDER BY sort_index`
      );
      
      // Ensure price is a number
      const menuItems = result.rows.map(row => ({
        ...row,
        price: typeof row.price === 'string' ? parseFloat(row.price) : row.price
      }));
      
      return NextResponse.json(menuItems);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    );
>>>>>>> d3399ff (Chefcito Beta!)
  }
}

// POST /api/menu-items - Create a new menu item
export async function POST(request: Request) {
  try {
    const body = await request.json();
<<<<<<< HEAD
    const { id, name, price, description, available, category, imageUrl, aiHint, linkedModifiers, sortIndex } = body;

    const result = await query(
      `INSERT INTO menu_items 
       (id, name, price, description, available, category, image_url, ai_hint, linked_modifiers, sort_index) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        id || `item_${Date.now()}`,
        name,
        price,
        description,
        available !== undefined ? available : true,
        category,
        imageUrl || '',
        aiHint || '',
        linkedModifiers || [],
        sortIndex || 0
      ]
    );

    const item = result.rows[0];
    // Ensure price is parsed as a number
    const menuItem = {
      ...item,
      price: typeof item.price === 'string' ? parseFloat(item.price) : item.price
    };
    
    return createResponse(menuItem, 201);
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
      [
        name,
        price,
        description,
        available,
        category,
        imageUrl,
        aiHint,
        linkedModifiers,
        sortIndex,
        id
      ]
    );

    if (result.rows.length === 0) {
      return createResponse({ error: 'Menu item not found' }, 404);
    }

    const item = result.rows[0];
    // Ensure price is parsed as a number
    const menuItem = {
      ...item,
      price: typeof item.price === 'string' ? parseFloat(item.price) : item.price
    };
    
    return createResponse(menuItem);
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

    return createResponse({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 });
=======
    const { 
      id, 
      name, 
      price, 
      description, 
      available, 
      category, 
      imageUrl, 
      aiHint, 
      linkedModifiers,
      sortIndex 
    } = body;

    const client = await pool.connect();
    try {
      // Get the max sort index if not provided
      let newSortIndex = sortIndex;
      if (newSortIndex === undefined) {
        const maxSortResult = await client.query(
          'SELECT COALESCE(MAX(sort_index), -1) as max_sort FROM menu_items'
        );
        newSortIndex = maxSortResult.rows[0].max_sort + 1;
      }

      const result = await client.query(
        `INSERT INTO menu_items 
         (id, name, price, description, available, category, image_url, ai_hint, linked_modifiers, sort_index) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
         RETURNING *`,
        [
          id || String(Date.now()),
          name,
          typeof price === 'string' ? parseFloat(price) : price,
          description,
          available !== undefined ? available : true,
          category,
          imageUrl || '',
          aiHint || '',
          linkedModifiers || [],
          newSortIndex
        ]
      );
      
      // Ensure price is a number in the response
      const menuItem = result.rows[0];
      const transformedItem = {
        ...menuItem,
        price: typeof menuItem.price === 'string' ? parseFloat(menuItem.price) : menuItem.price
      };
      
      return NextResponse.json(transformedItem, { status: 201 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating menu item:', error);
    return NextResponse.json(
      { error: 'Failed to create menu item' },
      { status: 500 }
    );
  }
}

// PUT /api/menu-items/{id} - Update a menu item
export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Menu item ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { 
      name, 
      price, 
      description, 
      available, 
      category, 
      imageUrl, 
      aiHint, 
      linkedModifiers,
      sortIndex 
    } = body;

    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE menu_items 
         SET name = $1, price = $2, description = $3, available = $4, category = $5,
             image_url = $6, ai_hint = $7, linked_modifiers = $8, sort_index = $9,
             updated_at = NOW()
         WHERE id = $10
         RETURNING *`,
        [
          name,
          typeof price === 'string' ? parseFloat(price) : price,
          description,
          available !== undefined ? available : true,
          category,
          imageUrl || '',
          aiHint || '',
          linkedModifiers || [],
          sortIndex !== undefined ? sortIndex : null,
          id
        ]
      );
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Menu item not found' },
          { status: 404 }
        );
      }
      
      // Ensure price is a number in the response
      const menuItem = result.rows[0];
      const transformedItem = {
        ...menuItem,
        price: typeof menuItem.price === 'string' ? parseFloat(menuItem.price) : menuItem.price
      };
      
      return NextResponse.json(transformedItem);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating menu item:', error);
    return NextResponse.json(
      { error: 'Failed to update menu item' },
      { status: 500 }
    );
  }
}

// DELETE /api/menu-items/{id} - Delete a menu item
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Menu item ID is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // Delete related records first (order item extras)
      await client.query('DELETE FROM order_item_extras WHERE extra_menu_item_id = $1', [id]);
      
      // Delete the menu item
      const result = await client.query('DELETE FROM menu_items WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Menu item not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ message: 'Menu item deleted successfully' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json(
      { error: 'Failed to delete menu item' },
      { status: 500 }
    );
>>>>>>> d3399ff (Chefcito Beta!)
  }
}