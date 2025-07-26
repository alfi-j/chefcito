
import { NextRequest, NextResponse } from 'next/server';
import { getCategories, addCategory, updateCategory, deleteCategory, isCategoryInUse } from '@/lib/data';

export async function GET() {
  try {
    const data = getCategories();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
    try {
        const { name } = await request.json();
        if (!name) {
            return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
        }
        const newCategory = addCategory(name);
        return NextResponse.json(newCategory, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { id, name } = await request.json();
         if (!id || !name) {
            return NextResponse.json({ error: 'Category ID and name are required' }, { status: 400 });
        }
        const updatedCategory = updateCategory(id, name);
        if (updatedCategory) {
            return NextResponse.json(updatedCategory);
        }
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { id, name } = await request.json();
        if (!id || !name) {
            return NextResponse.json({ error: 'Category ID and name are required' }, { status: 400 });
        }
        
        if (isCategoryInUse(name)) {
            return NextResponse.json({ error: `Cannot delete category "${name}" because it is still in use.` }, { status: 400 });
        }

        const success = deleteCategory(id);
        if (success) {
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
