import { NextResponse } from 'next/server';
import Subscription from '@/models/Subscription';
import User from '@/models/User';
import { initializeDatabase } from '@/lib/database-service';
import debug from 'debug';

const log = debug('chefcito:payphone:init');

/**
 * IMPORTANT: PayPhone does NOT support webhooks.
 *
 * Payment activation relies entirely on:
 * 1. The thank-you page (server-side resolution in /thank-you/page.tsx)
 * 2. The confirm endpoint (POST /api/payphone/confirm) called from client-side poller
 *
 * There is no webhook URL to configure in PayPhone's dashboard.
 */

// POST /api/payphone/init - Create subscription and return PayPhone config securely
export async function POST(request: Request) {
  try {
    await initializeDatabase();

    const body = await request.json();
    const { userId, userName, userEmail } = body;

    if (!userId || !userName || !userEmail) {
      return NextResponse.json(
        { error: 'userId, userName y userEmail son requeridos' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await User.findOne({ id: userId });
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const token = process.env.PAYPHONE_TOKEN;
    const storeId = process.env.PAYPHONE_STORE_ID;

    if (!token || !storeId) {
      console.error('[Payphone Init] Credenciales no configuradas en el servidor. Verifica PAYPHONE_TOKEN y PAYPHONE_STORE_ID en .env.local');
      return NextResponse.json(
        { error: 'Servicio de pagos no configurado' },
        { status: 500 }
      );
    }

    // Idempotency check: prevent duplicate subscription creation
    // This handles cases where React StrictMode double-invokes effects or user double-clicks
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const recentPending = await Subscription.findOne({
      userId,
      status: 'pending',
      createdAt: { $gte: twoMinutesAgo },
    });

    if (recentPending) {
      log('[Init] Recent pending subscription found, returning existing:', recentPending.clientTransactionId);
      // Return config with existing clientTransactionId to prevent duplicates
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) {
        console.error('[Payphone Init] NEXT_PUBLIC_BASE_URL no está configurado en .env.local');
        return NextResponse.json({ error: 'Servicio de pagos no configurado' }, { status: 500 });
      }

      const reference = `Suscripción Pro - ${userName}`.substring(0, 100);

      log('[Init] Widget config being sent:', JSON.stringify({ token: '***', storeId, clientTransactionId: recentPending.clientTransactionId, amount: 499, amountWithoutTax: 499, currency: 'USD', reference, email: userEmail, lang: 'es', defaultMethod: 'card', timeZone: -5 }, null, 2));

      return NextResponse.json({
        token,
        storeId,
        clientTransactionId: recentPending.clientTransactionId,
        amount: 499,
        amountWithoutTax: 499,
        currency: 'USD',
        reference,
        email: userEmail,
        lang: 'es',
        defaultMethod: 'card',
        timeZone: -5,
      });
    }

    // Generate unique transaction ID only if no recent pending subscription
    const clientTransactionId = `SUB-${Date.now()}`.substring(0, 50);

    log('[Init] Creating pending subscription for user:', userId, 'clientTransactionId:', clientTransactionId);

    // Cancel any previous pending/active subscriptions
    await Subscription.updateMany(
      { userId, status: { $in: ['active', 'pending'] } },
      { status: 'cancelled', cancelledAt: new Date() }
    );

    // Create pending subscription record
    await Subscription.create({
      userId,
      plan: 'pro',
      status: 'pending',
      amount: 499,
      currency: 'USD',
      clientTransactionId,
      paymentMethod: 'payphone',
      startDate: new Date(),
    });

    log('[Init] Pending subscription created successfully');

    // Build redirect URLs (used internally for tracking, not sent to PayPhone widget)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      console.error('[Payphone Init] NEXT_PUBLIC_BASE_URL no está configurado en .env.local');
      return NextResponse.json({ error: 'Servicio de pagos no configurado' }, { status: 500 });
    }

    const reference = `Suscripción Pro - ${userName}`.substring(0, 100);

    log('[Init] Widget config being sent:', JSON.stringify({ token: '***', storeId, clientTransactionId, amount: 499, amountWithoutTax: 499, currency: 'USD', reference, email: userEmail, lang: 'es', defaultMethod: 'card', timeZone: -5 }, null, 2));

    return NextResponse.json({
      token,
      storeId,
      clientTransactionId,
      amount: 499,
      amountWithoutTax: 499,
      currency: 'USD',
      reference,
      email: userEmail,
      lang: 'es',
      defaultMethod: 'card',
      timeZone: -5,
    });
  } catch (error) {
    log('[Init] Error:', error);
    console.error('[Payphone Init] Error:', error);
    return NextResponse.json(
      { error: 'Error al inicializar pago' },
      { status: 500 }
    );
  }
}
