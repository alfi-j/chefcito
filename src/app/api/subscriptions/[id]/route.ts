import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Subscription from '@/models/Subscription';
import User from '@/models/User';

// Helper function to ensure database connection
async function ensureDbConnection() {
  if (mongoose.connection.readyState !== 1) {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    await mongoose.connect(MONGODB_URI);
  }
}

// PUT /api/subscriptions/[id] - Actualizar suscripción (activar después de pago)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbConnection();

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    const { status, plan, payphoneTransactionId, cancellationReason, clientTransactionId } = body;

    // Buscar suscripción por clientTransactionId o _id
    let subscription = await Subscription.findOne({ 
      $or: [{ clientTransactionId: id }, { _id: id }] 
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Suscripción no encontrada' },
        { status: 404 }
      );
    }

    // Actualizar estado si se proporciona
    if (status) {
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

    // Actualizar clientTransactionId si se proporciona
    if (clientTransactionId) {
      subscription.clientTransactionId = clientTransactionId;
    }

    // Manejar cancelación
    if (status === 'cancelled') {
      subscription.cancelledAt = new Date();
      subscription.cancellationReason = cancellationReason || 'Cancelado por el usuario';
      
      // Actualizar membresía del usuario a 'free'
      await User.findOneAndUpdate(
        { id: subscription.userId },
        { membership: 'free' }
      );
    }

    // Manejar activación
    if (status === 'active') {
      subscription.startDate = new Date();
      
      // Actualizar membresía del usuario a 'pro'
      await User.findOneAndUpdate(
        { id: subscription.userId },
        { membership: 'pro' }
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
    await ensureDbConnection();

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { reason } = body || {};

    // Buscar suscripción
    const subscription = await Subscription.findOne({ 
      clientTransactionId: id,
      status: 'active'
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Suscripción activa no encontrada' },
        { status: 404 }
      );
    }

    // Cancelar suscripción
    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    subscription.cancellationReason = reason || 'Cancelado por el usuario';
    await subscription.save();

    // Actualizar membresía del usuario a 'free'
    await User.findOneAndUpdate(
      { id: subscription.userId },
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
