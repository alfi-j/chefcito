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

// POST /api/payphone/confirm - Confirmar pago de Payphone
export async function POST(request: Request) {
  try {
    await ensureDbConnection();

    const body = await request.json();
    const { transactionId, clientTransactionId, status, statusCode } = body;

    console.log('[Payphone Webhook] Recibiendo confirmación:', {
      transactionId,
      clientTransactionId,
      status,
      statusCode
    });

    // Buscar suscripción por clientTransactionId
    const subscription = await Subscription.findOne({ clientTransactionId });

    if (!subscription) {
      console.error('[Payphone Webhook] Suscripción no encontrada:', clientTransactionId);
      return NextResponse.json(
        { error: 'Suscripción no encontrada' },
        { status: 404 }
      );
    }

    // Verificar estado del pago
    // statusCode: 2 = Cancelado, 3 = Aprobado
    if (statusCode === 3 || status === 'Approved') {
      // Pago aprobado
      subscription.status = 'active';
      subscription.payphoneTransactionId = transactionId?.toString();
      subscription.startDate = new Date();
      
      // Actualizar usuario a Pro
      await User.findOneAndUpdate(
        { id: subscription.userId },
        { membership: 'pro' }
      );

      await subscription.save();

      console.log('[Payphone Webhook] Suscripción activada:', subscription._id);

      return NextResponse.json({
        success: true,
        message: 'Pago confirmado y suscripción activada',
        subscription: subscription.toObject()
      });
    } else if (statusCode === 2 || status === 'Canceled') {
      // Pago cancelado
      subscription.status = 'cancelled';
      subscription.cancelledAt = new Date();
      subscription.cancellationReason = 'Pago cancelado o fallido';
      
      await subscription.save();

      console.log('[Payphone Webhook] Suscripción cancelada:', subscription._id);

      return NextResponse.json({
        success: true,
        message: 'Pago cancelado',
        subscription: subscription.toObject()
      });
    } else {
      // Estado desconocido
      console.warn('[Payphone Webhook] Estado desconocido:', { statusCode, status });
      
      return NextResponse.json({
        success: false,
        message: 'Estado de pago desconocido',
        statusCode,
        status
      });
    }
  } catch (error) {
    console.error('[Payphone Webhook] Error al procesar confirmación:', error);
    return NextResponse.json(
      { error: 'Error al procesar confirmación de pago' },
      { status: 500 }
    );
  }
}

// GET /api/payphone/success - Página de éxito después del pago
export async function GET(request: Request) {
  try {
    await ensureDbConnection();

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId') || searchParams.get('id');
    const clientTransactionId = searchParams.get('clientTransactionId');

    console.log('[Payphone Success] Parámetros recibidos:', { transactionId, clientTransactionId });

    if (!transactionId || !clientTransactionId) {
      console.error('[Payphone Success] Parámetros faltantes');
      return NextResponse.redirect(new URL('/profile?payment=error', request.url));
    }

    // Confirmar pago con Payphone API
    const payphoneToken = process.env.PAYPHONE_TOKEN;
    const payphoneStoreId = process.env.PAYPHONE_STORE_ID;

    if (!payphoneToken || !payphoneStoreId) {
      console.error('[Payphone Success] Credenciales de Payphone no configuradas');
      return NextResponse.redirect(new URL('/profile?payment=error', request.url));
    }

    const confirmResponse = await fetch('https://pay.payphonetodoesposible.com/api/button/V2/Confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${payphoneToken}`
      },
      body: JSON.stringify({
        id: parseInt(transactionId),
        clientTxId: clientTransactionId
      })
    });

    if (!confirmResponse.ok) {
      console.error('[Payphone Success] Error al confirmar con Payphone:', confirmResponse.status);
      return NextResponse.redirect(new URL('/profile?payment=error', request.url));
    }

    const result = await confirmResponse.json();

    console.log('[Payphone Success] Respuesta de Payphone:', result);

    // Actualizar suscripción en base de datos
    const subscription = await Subscription.findOne({ clientTransactionId });

    if (!subscription) {
      console.error('[Payphone Success] Suscripción no encontrada:', clientTransactionId);
      return NextResponse.redirect(new URL('/profile?payment=error', request.url));
    }

    if (result.statusCode === 3) {
      // Pago aprobado
      subscription.status = 'active';
      subscription.payphoneTransactionId = result.transactionId?.toString();
      subscription.startDate = new Date();
      
      // Actualizar usuario a Pro
      await User.findOneAndUpdate(
        { id: subscription.userId },
        { membership: 'pro' }
      );

      await subscription.save();

      console.log('[Payphone Success] Suscripción activada:', subscription._id);

      return NextResponse.redirect(new URL('/profile?payment=success', request.url));
    } else if (result.statusCode === 2) {
      // Pago fallido o cancelado
      subscription.status = 'cancelled';
      subscription.cancelledAt = new Date();
      subscription.cancellationReason = 'Pago cancelado o fallido';
      
      await subscription.save();

      console.log('[Payphone Success] Suscripción cancelada:', subscription._id);

      return NextResponse.redirect(new URL('/profile?payment=failed', request.url));
    } else {
      // Estado desconocido
      console.warn('[Payphone Success] Estado desconocido:', result);
      return NextResponse.redirect(new URL('/profile?payment=error', request.url));
    }
  } catch (error) {
    console.error('[Payphone Success] Error:', error);
    return NextResponse.redirect(new URL('/profile?payment=error', request.url));
  }
}
