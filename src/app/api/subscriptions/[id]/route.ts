import { NextResponse } from 'next/server';
import Subscription from '@/models/Subscription';
import Restaurant from '@/models/Restaurant';
import { initializeDatabase } from '@/lib/database-service';
import { requireAuth } from '@/lib/auth';

async function assertOwnerOfSubscription(request: Request, subscriptionId: string) {
  const auth = await requireAuth(request);
  if (!auth?.userId) {
    return { error: 'No autorizado', status: 401 };
  }

  const subscription = await Subscription.findOne({
    $or: [{ clientTransactionId: subscriptionId }, { _id: subscriptionId }]
  });

  if (!subscription) {
    return { error: 'Suscripción no encontrada', status: 404 };
  }

  const restaurant = await Restaurant.findOne({ id: subscription.restaurantId });
  if (!restaurant || restaurant.ownerId !== auth.userId) {
    return { error: 'No autorizado para esta suscripción', status: 403 };
  }

  return { subscription };
}

// PUT /api/subscriptions/[id] - Actualizar suscripción (activar después de pago)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const result = await assertOwnerOfSubscription(request, id);
    if ('error' in result || !result.subscription) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const subscription = result.subscription;
    const body = await request.json();

    const { status, plan, payphoneTransactionId, cancellationReason } = body;

    // Actualizar estado si se proporciona
    if (status) {
      // Activation must only happen through the PayPhone confirm/reconcile
      // flow, never directly — otherwise anyone could set a subscription
      // to "active" and unlock Pro for free.
      if (status === 'active') {
        return NextResponse.json(
          { error: 'La activación solo puede realizarse tras confirmar el pago con PayPhone' },
          { status: 400 }
        );
      }
      subscription.status = status;
    }

    // Actualizar plan si se proporciona
    if (plan) {
      subscription.plan = plan;
    }

    // Actualizar ID de transacción de Payphone
    if (payphoneTransactionId) {
      subscription.payphoneTransactionId = payphoneTransactionId;
    }

    // Manejar cancelación
    if (status === 'cancelled') {
      subscription.cancelledAt = new Date();
      subscription.cancellationReason = cancellationReason || 'Cancelado por el usuario';

      // Actualizar membresía del restaurante a 'free'
      await Restaurant.findOneAndUpdate(
        { id: subscription.restaurantId },
        { membership: 'free' }
      );
    }

    await subscription.save();

    return NextResponse.json({
      success: true,
      subscription: subscription.toObject()
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Error al actualizar suscripción' },
      { status: 500 }
    );
  }
}

// DELETE /api/subscriptions/[id] - Cancelar suscripción
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const result = await assertOwnerOfSubscription(request, id);
    if ('error' in result || !result.subscription) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const subscription = result.subscription;

    const body = await request.json().catch(() => ({}));
    const { reason } = body || {};

    // Cancelar suscripción
    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    subscription.cancellationReason = reason || 'Cancelado por el usuario';
    await subscription.save();

    // Actualizar membresía del restaurante a 'free'
    await Restaurant.findOneAndUpdate(
      { id: subscription.restaurantId },
      { membership: 'free' }
    );

    return NextResponse.json({
      success: true,
      message: 'Suscripción cancelada exitosamente'
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: 'Error al cancelar suscripción' },
      { status: 500 }
    );
  }
}