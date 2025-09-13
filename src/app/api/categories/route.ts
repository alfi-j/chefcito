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

// GET /api/categories - Get all categories
export async function GET() {
  try {
    const result = await query('SELECT * FROM categories ORDER BY id');
    return createResponse(result.rows);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return createResponse({ error: 'Failed to fetch categories', details: error.message }, 500);
  }
}

// POST /api/categories - Create a new category
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, isModifierGroup, linkedModifiers, parentId } = body;

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
  }
}