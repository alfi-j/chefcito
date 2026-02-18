import { NextResponse } from 'next/server';
import { deleteCategory, updateCategory } from '@/lib/database-service';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const params = await context.params;
    const { id } = params;
    
    const updated = await updateCategory(id, body.data);
    if (updated) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to update category' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error updating category:', error);
    const status = error.message?.includes('Database connection failed') ? 503 : 500;
    return NextResponse.json(
      { error: error.message || 'Failed to update category' },
      { status }
    );
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;
    await deleteCategory(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    const status = error.message?.includes('Database connection failed') ? 503 : 500;
    return NextResponse.json(
      { error: error.message || 'Failed to delete category' },
      { status }
    );
  }
}