import { NextResponse } from 'next/server';
import { updateInventoryItem, updateInventoryStock, deleteInventoryItem, resolveInventoryItemRestaurantId } from '@/lib/database-service';
import { debugInventory } from '@/lib/helpers';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const params = await context.params;
    debugInventory('PUT: request received with params %O and body %O', params, body);

    const { id } = params;
    const restaurantId = body.data?.restaurantId || body.restaurantId || (await resolveInventoryItemRestaurantId(id));

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId is required' },
        { status: 400 }
      );
    }

    if (body.action === 'adjustStock') {
      debugInventory('PUT: adjusting stock for item %s by amount %d', id, body.amount);
      const updatedItem = await updateInventoryStock(id, restaurantId, body.amount);
      if (updatedItem) {
        debugInventory('PUT: successfully adjusted stock for item %s', id);
        return NextResponse.json({ success: true, data: updatedItem });
      } else {
        debugInventory('PUT: failed to adjust stock for item %s', id);
        return NextResponse.json(
          { error: 'Failed to update inventory item' },
          { status: 500 }
        );
      }
    } else {
      debugInventory('PUT: updating item %s with data %O', id, body.data);
      const updatedItem = await updateInventoryItem(id, restaurantId, body.data);
      if (updatedItem) {
        debugInventory('PUT: successfully updated item %s', id);
        return NextResponse.json({ success: true, data: updatedItem });
      } else {
        debugInventory('PUT: failed to update item %s', id);
        return NextResponse.json(
          { error: 'Failed to update inventory item' },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    debugInventory('PUT: error updating inventory item: %O', error);
    console.error('Error updating inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;
    debugInventory('DELETE: request received for item with id %s', id);
    const restaurantId = await resolveInventoryItemRestaurantId(id);
    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }
    await deleteInventoryItem(id, restaurantId);
    debugInventory('DELETE: successfully deleted item with id %s', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    debugInventory('DELETE: error deleting inventory item: %O', error);
    console.error('Error deleting inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to delete inventory item' },
      { status: 500 }
    );
  }
}