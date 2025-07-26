
import { NextRequest, NextResponse } from 'next/server';
import { getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem } from '@/lib/data';

export async function GET() {
  try {
    const menuItems = getMenuItems();
    return NextResponse.json(menuItems);
  } catch (error: any) {
     return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
    try {
        const itemData = await request.json();
        const newItem = addMenuItem(itemData);
        return NextResponse.json(newItem, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const itemData = await request.json();
        const updatedItem = updateMenuItem(itemData);
        if (updatedItem) {
            return NextResponse.json(updatedItem);
        }
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { id } = await request.json();
         if (!id) {
            return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
        }
        const success = deleteMenuItem(id);
        if (success) {
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
