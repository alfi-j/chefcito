import { NextResponse } from 'next/server';
import { getInventoryItems } from '@/lib/mongo-data-service';

export async function GET() {
  try {
    const inventoryItems = await getInventoryItems();
    return NextResponse.json(inventoryItems);
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory items' },
      { status: 500 }
    );
  }
}