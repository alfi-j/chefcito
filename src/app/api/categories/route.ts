<<<<<<< HEAD
import { query } from '../lib/db';
import { Category } from '../lib/types';

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
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
>>>>>>> d3399ff (Chefcito Beta!)

// GET /api/categories - Get all categories
export async function GET() {
  try {
<<<<<<< HEAD
    // Log environment variable status for debugging
    console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    const result = await query('SELECT * FROM categories ORDER BY id');
    return createResponse(result.rows);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return createResponse({ 
      error: 'Failed to fetch categories', 
      details: error.message,
      // Additional debugging info
      debug: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV
      }
    }, 500);
=======
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM categories ORDER BY name');
      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
>>>>>>> d3399ff (Chefcito Beta!)
  }
}

// POST /api/categories - Create a new category
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, isModifierGroup, linkedModifiers, parentId } = body;

<<<<<<< HEAD
    const result = await query(
      `INSERT INTO categories (name, is_modifier_group, linked_modifiers, parent_id) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, isModifierGroup || false, linkedModifiers || [], parentId || null]
    );

    return createResponse(result.rows[0], 201);
  } catch (error: any) {
    console.error('Error creating category:', error);
    return createResponse({ error: 'Failed to create category', details: error.message }, 500);
  }
}

// PUT /api/categories/:id - Update a category
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return createResponse({ error: 'Category ID is required' }, 400);
    }

    const body = await request.json();
    const { name, isModifierGroup, linkedModifiers, parentId } = body;

    const result = await query(
      `UPDATE categories 
       SET name = $1, is_modifier_group = $2, linked_modifiers = $3, parent_id = $4 
       WHERE id = $5 RETURNING *`,
      [name, isModifierGroup, linkedModifiers, parentId, id]
    );

    if (result.rows.length === 0) {
      return createResponse({ error: 'Category not found' }, 404);
    }

    return createResponse(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating category:', error);
    return createResponse({ error: 'Failed to update category', details: error.message }, 500);
  }
}

// DELETE /api/categories/:id - Delete a category
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return createResponse({ error: 'Category ID is required' }, 400);
    }

    const result = await query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return createResponse({ error: 'Category not found' }, 404);
    }

    return createResponse({ message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return createResponse({ error: 'Failed to delete category', details: error.message }, 500);
=======
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO categories (name, is_modifier_group, linked_modifiers, parent_id) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [name, isModifierGroup, linkedModifiers, parentId]
      );
      
      return NextResponse.json(result.rows[0], { status: 201 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

// PUT /api/categories/{id} - Update a category
export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { name, isModifierGroup, linkedModifiers, parentId } = body;

    const client = await pool.connect();
    try {
      // Check if category exists
      const categoryCheck = await client.query(
        'SELECT 1 FROM categories WHERE id = $1',
        [id]
      );
      
      if (categoryCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }
      
      // If parent_id is being updated, check if this category is used by any menu items
      if (parentId !== undefined) {
        const checkResult = await client.query(
          'SELECT COUNT(*) as count FROM menu_items WHERE category = $1',
          [id]
        );
        
        if (parseInt(checkResult.rows[0].count) > 0) {
          return NextResponse.json(
            { error: 'Cannot update category that is used by menu items' },
            { status: 400 }
          );
        }
      }
      
      const result = await client.query(
        `UPDATE categories 
         SET name = $1, is_modifier_group = $2, linked_modifiers = $3, parent_id = $4,
             updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [name, isModifierGroup, linkedModifiers, parentId, id]
      );
      
      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/{id} - Delete a category
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // Check if category is used by any menu items
      const checkResult = await client.query(
        'SELECT COUNT(*) as count FROM menu_items WHERE category = $1',
        [id]
      );
      
      if (parseInt(checkResult.rows[0].count) > 0) {
        return NextResponse.json(
          { error: 'Cannot delete category that is used by menu items' },
          { status: 400 }
        );
      }
      
      // Delete the category
      const result = await client.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ message: 'Category deleted successfully' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
>>>>>>> d3399ff (Chefcito Beta!)
  }
}