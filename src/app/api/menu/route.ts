import { NextResponse } from 'next/server';
import { 
  addMenuItem, 
  updateMenuItem, 
  deleteMenuItem,
  deleteMenuItems,
  addCategory,
  updateCategory,
  deleteCategory
} from '@/lib/mongo-data-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    switch (body.action) {
      case 'addMenuItem':
        const newMenuItem = await addMenuItem(body.data);
        return NextResponse.json(newMenuItem);
        
      case 'addCategory':
        const newCategory = await addCategory(body.data);
        return NextResponse.json(newCategory);
        
      case 'updateCategory':
        const updatedCategory = await updateCategory(body.id, body.data);
        return NextResponse.json(updatedCategory);
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in menu operations:', error);
    return NextResponse.json(
      { error: 'Failed to perform menu operation' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    switch (body.action) {
      case 'updateCategory':
        const updatedCategory = await updateCategory(body.id, body.data);
        return NextResponse.json(updatedCategory);
        
      case 'updateMenuItem':
        const updatedItem = await updateMenuItem(body.id, body.data);
        return NextResponse.json(updatedItem);
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error updating menu:', error);
    return NextResponse.json(
      { error: 'Failed to update menu' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    
    switch (body.action) {
      case 'deleteMenuItem':
        await deleteMenuItem(body.id);
        return NextResponse.json({ success: true });
        
      case 'deleteMenuItems':
        await deleteMenuItems(body.ids);
        return NextResponse.json({ success: true });
        
      case 'deleteCategory':
        await deleteCategory(body.id);
        return NextResponse.json({ success: true });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error deleting menu items:', error);
    return NextResponse.json(
      { error: 'Failed to delete menu items' },
      { status: 500 }
    );
  }
}