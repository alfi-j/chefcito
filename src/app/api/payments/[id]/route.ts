import { NextResponse } from 'next/server';
import { getPaymentMethods, updatePaymentMethod, deletePaymentMethod, resolvePaymentMethodRestaurantId } from '@/lib/database-service';

// GET /api/payments/[id] - get specific payment method
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    if (!params?.id) {
      return NextResponse.json(
        { success: false, error: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    const restaurantId = await resolvePaymentMethodRestaurantId(params ? params['id'] : '');
    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Payment method not found' },
        { status: 404 }
      );
    }

    const payments = await getPaymentMethods(restaurantId);
    const method = payments.find(m => m.id === (params ? params['id'] : undefined));
    
    if (!method) {
      return NextResponse.json(
        { success: false, error: 'Payment method not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: method });
  } catch (error: unknown) {
    console.error('Error fetching payment method:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch payment method' },
      { status: 500 }
    );
  }
}

// PUT /api/payments/[id] - update specific payment method
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    if (!params?.id) {
      return NextResponse.json(
        { success: false, error: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const restaurantId = body.restaurantId || (await resolvePaymentMethodRestaurantId(params ? params['id'] : ''));
    if (!restaurantId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment method not found'
        },
        { status: 404 }
      );
    }
    const updatedMethod = await updatePaymentMethod(params ? params['id'] : '', restaurantId, body);
    
    if (updatedMethod) {
      return NextResponse.json({ 
        success: true,
        data: updatedMethod 
      });
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: 'Payment method not found or not updated' 
        },
        { status: 404 }
      );
    }
  } catch (error: unknown) {
    console.error('Error updating payment method:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update payment method' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/payments/[id] - delete specific payment method
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    if (!params?.id) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Payment method ID is required' 
        },
        { status: 400 }
      );
    }
    
    const restaurantId = await resolvePaymentMethodRestaurantId(params ? params['id'] : '');
    if (!restaurantId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment method not found'
        },
        { status: 404 }
      );
    }

    const result = await deletePaymentMethod(params ? params['id'] : '', restaurantId);
    if (result) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: 'Payment method not found or not deleted' 
        },
        { status: 404 }
      );
    }
  } catch (error: unknown) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete payment method' 
      },
      { status: 500 }
    );
  }
}