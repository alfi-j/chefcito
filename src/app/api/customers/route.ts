import { NextResponse } from 'next/server';
<<<<<<< HEAD
import { query } from '../lib/db';
import { Customer } from '../lib/types';
=======
import { pool } from '@/lib/db';
>>>>>>> d3399ff (Chefcito Beta!)

// GET /api/customers - Get all customers
export async function GET() {
  try {
<<<<<<< HEAD
    const result = await query('SELECT * FROM customers ORDER BY name');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
=======
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM customers ORDER BY name');
      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
>>>>>>> d3399ff (Chefcito Beta!)
  }
}

// POST /api/customers - Create a new customer
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, email } = body;

<<<<<<< HEAD
    const result = await query(
      `INSERT INTO customers (id, name, email) VALUES ($1, $2, $3) RETURNING *`,
      [id, name, email]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}

// PUT /api/customers/:id - Update a customer
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, email } = body;

    const result = await query(
      `UPDATE customers SET name = $1, email = $2 WHERE id = $3 RETURNING *`,
      [name, email, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

// DELETE /api/customers/:id - Delete a customer
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const result = await query('DELETE FROM customers WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
=======
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO customers (id, name, email) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [id || String(Date.now()), name, email]
      );
      
      return NextResponse.json(result.rows[0], { status: 201 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}

// PUT /api/customers/{id} - Update a customer
export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { name, email } = body;

    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE customers 
         SET name = $1, email = $2, updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [name, email, id]
      );
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/{id} - Delete a customer
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // Check if customer is referenced by any orders
      const checkResult = await client.query(
        'SELECT COUNT(*) as count FROM orders WHERE customer_id = $1',
        [id]
      );
      
      if (parseInt(checkResult.rows[0].count) > 0) {
        return NextResponse.json(
          { error: 'Cannot delete customer that is referenced by orders' },
          { status: 400 }
        );
      }
      
      // Delete the customer
      const result = await client.query('DELETE FROM customers WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ message: 'Customer deleted successfully' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
>>>>>>> d3399ff (Chefcito Beta!)
  }
}