import { NextResponse } from 'next/server';
import { getMenuItems } from '@/lib/mongo-data-service';

export async function GET() {
  try {
    const menuItems = await getMenuItems();
    return NextResponse.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
}