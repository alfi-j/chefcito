import { NextResponse } from 'next/server';
import { getInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, resolveInventoryItemRestaurantId } from '@/lib/database-service';

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'An unknown error occurred';
import { debugInventory } from '@/lib/helpers';

export async function GET(request: Request, context: { params: Promise<{ id?: string }> }) {
  const resolvedParams = await context.params;
  
  // Check if we're fetching a specific item by ID
  if (resolvedParams && resolvedParams['id']) {
    try {
      const { id } = resolvedParams;
      debugInventory('GET: fetching specific item with id %s', id);
      
      // Get restaurantId from query params
      const { searchParams } = new URL(request.url);
      const restaurantId = searchParams.get('restaurantId');

      if (!restaurantId) {
        return NextResponse.json(
          { success: false, error: 'restaurantId is required' },
          { status: 400 }
        );
      }
      
      const inventoryItems = await getInventory(restaurantId);
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
    } catch (error: unknown) {
      debugInventory('GET: error fetching inventory item: %O', error);
      console.error('Error fetching inventory item:', error);
      return NextResponse.json(
        { success: false, error: toErrorMessage(error) || 'Failed to fetch inventory item' },
        { status: 500 }
      );
    }
  }
  
  // Handle GET /api/inventory - get all inventory items for a restaurant
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, data: [], error: 'restaurantId is required' },
        { status: 400 }
      );
    }

    debugInventory('GET: fetching inventory items for restaurant %s', restaurantId);
    const inventoryItems = await getInventory(restaurantId);
    debugInventory('GET: successfully fetched %d inventory items', inventoryItems.length);
    return NextResponse.json({
      success: true,
      data: inventoryItems,
      error: null,
      message: null
    });
  } catch (error: unknown) {
    debugInventory('GET: error fetching inventory items: %O', error);
    console.error('Error fetching inventory items:', error);
    return NextResponse.json(
      {
        success: false,
        data: [],
        error: toErrorMessage(error) || 'Failed to fetch inventory items',
        message: toErrorMessage(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    debugInventory('POST: request received with data %O', data);
    
    // Validate restaurantId
    if (!data.restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId is required' },
        { status: 400 }
      );
    }
    
    // Map reorderThreshold from frontend to reorderLevel expected by the model
    const mappedData = {
      ...data,
      reorderLevel: data.reorderThreshold,
    };
    const newItem = await addInventoryItem(mappedData);
    debugInventory('POST: successfully added new item with id %s', newItem.id);
    return NextResponse.json(newItem);
  } catch (error: unknown) {
    debugInventory('POST: error adding inventory item: %O', error);
    console.error('Error adding inventory item:', error);
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to add inventory item' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, ...itemData } = data;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }
    
    debugInventory('PUT: updating item %s with data %O', id, itemData);
    const restaurantId = itemData.restaurantId || (await resolveInventoryItemRestaurantId(id));
    if (!restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId is required' },
        { status: 400 }
      );
    }
    const result = await updateInventoryItem(id, restaurantId, itemData);
    
    if (result) {
      debugInventory('PUT: successfully updated item %s', id);
      return NextResponse.json({ success: true });
    } else {
      debugInventory('PUT: failed to update item %s', id);
      return NextResponse.json(
        { error: 'Failed to update inventory item' },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    debugInventory('PUT: error updating inventory item: %O', error);
    console.error('Error updating inventory item:', error);
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to update inventory item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }
    
    debugInventory('DELETE: deleting item %s', id);
    const restaurantId = await resolveInventoryItemRestaurantId(id);
    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }
    const result = await deleteInventoryItem(id, restaurantId);
    
    if (result) {
      debugInventory('DELETE: successfully deleted item %s', id);
      return NextResponse.json({ success: true });
    } else {
      debugInventory('DELETE: failed to delete item %s', id);
      return NextResponse.json(
        { error: 'Failed to delete inventory item' },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    debugInventory('DELETE: error deleting inventory item: %O', error);
    console.error('Error deleting inventory item:', error);
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to delete inventory item' },
      { status: 500 }
    );
  }
}