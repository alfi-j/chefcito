import { NextResponse } from 'next/server';
import { getCategories } from '@/lib/database-service';

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({
      success: true,
      data: categories,
      error: null,
      message: null
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    // Return appropriate HTTP status based on error type
    const status = error.message?.includes('Database connection failed') ? 503 : 500;
    return NextResponse.json(
      {
        success: false,
        data: [],
        error: error.message || 'Failed to fetch categories',
        message: error.message || 'An unknown error occurred'
      },
      { status }
    );
  }
}