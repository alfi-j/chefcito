import { NextResponse } from 'next/server';
import { getInventory, addInventoryItem } from '@/lib/database-service';
import { debugInventory } from '@/lib/helpers';

export async function GET(request: Request, context: { params: Promise<{}> }) {
  const resolvedParams = await context.params;
  // @ts-ignore
  if (resolvedParams && resolvedParams['id']) {
    // For now, we'll return all inventory and let the frontend filter
    // In a more robust implementation, we'd fetch a specific item
    try {
      // @ts-ignore
      const { id } = resolvedParams;
      debugInventory('GET: fetching specific item with id %s', id);
      const inventoryItems = await getInventory();
      const item = inventoryItems.find(i => i.id === id);
      
      if (!item) {
        debugInventory('GET: item with id %s not found', id);
        return NextResponse.json(
          { success: false, error: 'Item not found' },
          { status: 404 }
        );
      }
      
      debugInventory('GET: successfully found item with id %s', id);
      return NextResponse.json({ success: true, data: item });
    } catch (error: any) {
      debugInventory('GET: error fetching inventory item: %O', error);
      console.error('Error fetching inventory item:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to fetch inventory item' },
        { status: 500 }
      );
    }
  }
  
  // Handle GET /api/inventory - get all inventory items
  try {
    debugInventory('GET: fetching all inventory items');
    const inventoryItems = await getInventory();
    debugInventory('GET: successfully fetched %d inventory items', inventoryItems.length);
    return NextResponse.json({
      success: true,
      data: inventoryItems,
      error: null,
      message: null
    });
  } catch (error: any) {
    debugInventory('GET: error fetching inventory items: %O', error);
    console.error('Error fetching inventory items:', error);
    return NextResponse.json(
      {
        success: false,
        data: [],
        error: error.message || 'Failed to fetch inventory items',
        message: error.message || 'An unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    debugInventory('POST: request received with data %O', data);
    // Map reorderThreshold from frontend to reorderLevel expected by the model
    const mappedData = {
      ...data,
      reorderLevel: data.reorderThreshold,
    };
    const newItem = await addInventoryItem(mappedData);
    debugInventory('POST: successfully added new item with id %s', newItem.id);
    return NextResponse.json(newItem);
  } catch (error) {
    debugInventory('POST: error adding inventory item: %O', error);
    console.error('Error adding inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to add inventory item' },
      { status: 500 }
    );
  }
}