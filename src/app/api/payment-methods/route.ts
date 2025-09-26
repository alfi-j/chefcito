import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// GET /api/payment-methods - Get all payment methods
export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM payment_methods ORDER BY name');
      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}

// POST /api/payment-methods - Create a new payment method
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, type, enabled, banks } = body;

    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO payment_methods (id, name, type, enabled, banks) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [id || String(Date.now()), name, type, enabled, banks || []]
      );
      
      return NextResponse.json(result.rows[0], { status: 201 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating payment method:', error);
    return NextResponse.json(
      { error: 'Failed to create payment method' },
      { status: 500 }
    );
  }
}

// PUT /api/payment-methods/{id} - Update a payment method
export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { name, type, enabled, banks } = body;

    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE payment_methods 
         SET name = $1, type = $2, enabled = $3, banks = $4, updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [name, type, enabled, banks || [], id]
      );
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Payment method not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating payment method:', error);
    return NextResponse.json(
      { error: 'Failed to update payment method' },
      { status: 500 }
    );
  }
}

// DELETE /api/payment-methods/{id} - Delete a payment method
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // Delete the payment method
      const result = await client.query('DELETE FROM payment_methods WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Payment method not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ message: 'Payment method deleted successfully' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json(
      { error: 'Failed to delete payment method' },
      { status: 500 }
    );
  }
}