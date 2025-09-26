import { NextResponse } from 'next/server';
<<<<<<< HEAD
import { query } from '../lib/db';
import { Staff } from '../lib/types';
=======
import { pool } from '@/lib/db';
>>>>>>> d3399ff (Chefcito Beta!)

// GET /api/staff - Get all staff members
export async function GET() {
  try {
<<<<<<< HEAD
    const result = await query('SELECT * FROM staff ORDER BY name');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching staff members:', error);
    return NextResponse.json({ error: 'Failed to fetch staff members' }, { status: 500 });
=======
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM staff ORDER BY name');
      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
      { status: 500 }
    );
>>>>>>> d3399ff (Chefcito Beta!)
  }
}

// POST /api/staff - Create a new staff member
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, email, role, status } = body;

<<<<<<< HEAD
    const result = await query(
      `INSERT INTO staff (id, name, email, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, name, email, role, status]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating staff member:', error);
    return NextResponse.json({ error: 'Failed to create staff member' }, { status: 500 });
  }
}

// PUT /api/staff/:id - Update a staff member
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, email, role, status } = body;

    const result = await query(
      `UPDATE staff SET name = $1, email = $2, role = $3, status = $4 WHERE id = $5 RETURNING *`,
      [name, email, role, status, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating staff member:', error);
    return NextResponse.json({ error: 'Failed to update staff member' }, { status: 500 });
  }
}

// DELETE /api/staff/:id - Delete a staff member
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 });
    }

    const result = await query('DELETE FROM staff WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('Error deleting staff member:', error);
    return NextResponse.json({ error: 'Failed to delete staff member' }, { status: 500 });
=======
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO staff (id, name, email, role, status) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [id || String(Date.now()), name, email, role, status]
      );
      
      return NextResponse.json(result.rows[0], { status: 201 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating staff member:', error);
    return NextResponse.json(
      { error: 'Failed to create staff member' },
      { status: 500 }
    );
  }
}

// PUT /api/staff/{id} - Update a staff member
export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Staff ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { name, email, role, status } = body;

    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE staff 
         SET name = $1, email = $2, role = $3, status = $4, updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [name, email, role, status, id]
      );
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Staff member not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating staff member:', error);
    return NextResponse.json(
      { error: 'Failed to update staff member' },
      { status: 500 }
    );
  }
}

// DELETE /api/staff/{id} - Delete a staff member
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Staff ID is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // Check if staff member is referenced by any orders or tasks
      const checkOrdersResult = await client.query(
        'SELECT COUNT(*) as count FROM orders WHERE staff_name = $1',
        [id]
      );
      
      const checkTasksResult = await client.query(
        'SELECT COUNT(*) as count FROM tasks WHERE assigned_to = $1',
        [id]
      );
      
      if (parseInt(checkOrdersResult.rows[0].count) > 0 || 
          parseInt(checkTasksResult.rows[0].count) > 0) {
        return NextResponse.json(
          { error: 'Cannot delete staff member that is referenced by orders or tasks' },
          { status: 400 }
        );
      }
      
      // Delete the staff member
      const result = await client.query('DELETE FROM staff WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Staff member not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ message: 'Staff member deleted successfully' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting staff member:', error);
    return NextResponse.json(
      { error: 'Failed to delete staff member' },
      { status: 500 }
    );
>>>>>>> d3399ff (Chefcito Beta!)
  }
}