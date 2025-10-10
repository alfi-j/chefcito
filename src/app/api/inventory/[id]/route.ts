import { NextResponse } from 'next/server';
import { addInventoryItem, updateInventoryItem, updateInventoryStock, deleteInventoryItem } from '@/lib/mongo-data-service';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const newItem = await addInventoryItem(data);
    return NextResponse.json(newItem);
  } catch (error) {
    console.error('Error adding inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to add inventory item' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    
    if (body.action === 'adjustStock') {
      const updatedItem = await updateInventoryStock(params.id, body.amount);
      return NextResponse.json(updatedItem);
    } else {
      const updatedItem = await updateInventoryItem(params.id, body.data);
      return NextResponse.json(updatedItem);
    }
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await deleteInventoryItem(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to delete inventory item' },
      { status: 500 }
    );
  }
}