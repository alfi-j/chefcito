import { NextResponse } from 'next/server';
import { getCustomers } from '@/lib/database-service';

export async function GET() {
  try {
    const customers = await getCustomers();
    return NextResponse.json({
      success: true,
      data: customers,
      error: null,
      message: null
    });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      {
        success: false,
        data: [],
        error: error.message || 'Failed to fetch customers',
        message: error.message || 'An unknown error occurred'
      },
      { status: 500 }
    );
  }
}