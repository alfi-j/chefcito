
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase.from('menu_items').select('*').order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const menuItems = data.map((item: any) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    category: item.category,
    imageUrl: item.image_url,
    aiHint: item.ai_hint,
  }));

  return NextResponse.json(menuItems);
}

export async function POST(request: NextRequest) {
    const supabase = createClient();
    const item = await request.json();

    const { data, error } = await supabase
        .from('menu_items')
        .insert({
            name: item.name,
            price: item.price,
            category: item.category,
            image_url: item.imageUrl,
            ai_hint: item.aiHint,
        })
        .select()
        .single();
        
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const newItem = { ...data, imageUrl: data.image_url, aiHint: data.ai_hint };
    return NextResponse.json(newItem, { status: 201 });
}

export async function PUT(request: NextRequest) {
    const supabase = createClient();
    const item = await request.json();

    const { data, error } = await supabase
        .from('menu_items')
        .update({
            name: item.name,
            price: item.price,
            category: item.category,
            image_url: item.imageUrl,
            ai_hint: item.aiHint,
        })
        .eq('id', item.id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const updatedItem = { ...data, imageUrl: data.image_url, aiHint: data.ai_hint };
    return NextResponse.json(updatedItem);
}

export async function DELETE(request: NextRequest) {
    const supabase = createClient();
    const { id } = await request.json();

    if (!id) {
        return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const { error } = await supabase.from('menu_items').delete().eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
