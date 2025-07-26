
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase.from('categories').select('*').order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
    const supabase = createClient();
    const { name } = await request.json();
    
    const { data, error } = await supabase
        .from('categories')
        .insert({ name })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: NextRequest) {
    const supabase = createClient();
    const { id, name } = await request.json();
    
    const { data, error } = await supabase
        .from('categories')
        .update({ name })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
    const supabase = createClient();
    const { id, name } = await request.json();

    if (!id || !name) {
        return NextResponse.json({ error: 'Category ID and name are required' }, { status: 400 });
    }
    
    // Check if any menu items are using this category
    const { count, error: checkError } = await supabase
        .from('menu_items')
        .select('*', { count: 'exact', head: true })
        .eq('category', name);

    if (checkError) {
        return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (count && count > 0) {
        return NextResponse.json({ error: `Cannot delete category "${name}" because it is still in use by ${count} menu item(s).` }, { status: 400 });
    }

    // If not in use, proceed with deletion
    const { error: deleteError } = await supabase.from('categories').delete().eq('id', id);

    if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
}
