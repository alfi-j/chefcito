import { NextResponse } from 'next/server';
import Subscription from '@/models/Subscription';
import Restaurant from '@/models/Restaurant';
import { initializeDatabase } from '@/lib/database-service';
import { requireAuth } from '@/lib/auth';
import { PRO_PLAN, newClientTransactionId, proReference } from '@/lib/subscription';
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

    const auth = await requireAuth(request);
    if (!auth?.userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { restaurantId, ownerEmail } = body;

    if (!restaurantId || !ownerEmail) {
      return NextResponse.json(
        { error: 'restaurantId y ownerEmail son requeridos' },
        { status: 400 }
      );
    }

    // Verify restaurant exists and the authenticated user owns it.
    // Ownership is enforced server-side; the client-supplied restaurantId
    // is never trusted to authorize a subscription.
    const restaurant = await Restaurant.findOne({ id: restaurantId });
    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurante no encontrado' },
        { status: 404 }
      );
    }

    if (restaurant.ownerId !== auth.userId) {
      return NextResponse.json(
        { error: 'No autorizado para este restaurante' },
        { status: 403 }
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

    // Cancel any previous pending/active subscriptions for this restaurant
    await Subscription.updateMany(
      { restaurantId, status: { $in: ['active', 'pending'] } },
      { status: 'cancelled', cancelledAt: new Date() }
    );

    // Always generate a NEW unique transaction ID — PayPhone rejects duplicates
    const clientTransactionId = newClientTransactionId();

    // Create pending subscription record
    await Subscription.create({
      restaurantId,
      plan: PRO_PLAN.plan,
      status: 'pending',
      amount: PRO_PLAN.amount,
      currency: PRO_PLAN.currency,
      clientTransactionId,
      paymentMethod: 'payphone',
      startDate: new Date(),
    });

    log('[Init] Pending subscription created successfully');

    const reference = proReference(restaurant.name);

    log('[Init] Widget config being sent:', JSON.stringify({ token: '***', storeId, clientTransactionId, amount: PRO_PLAN.amount, amountWithoutTax: PRO_PLAN.amountWithoutTax, currency: PRO_PLAN.currency, reference, email: ownerEmail, lang: PRO_PLAN.lang, defaultMethod: PRO_PLAN.defaultMethod, timeZone: PRO_PLAN.timeZone }, null, 2));

    return NextResponse.json({
      token,
      storeId,
      clientTransactionId,
      amount: PRO_PLAN.amount,
      amountWithoutTax: PRO_PLAN.amountWithoutTax,
      currency: PRO_PLAN.currency,
      reference,
      email: ownerEmail,
      lang: PRO_PLAN.lang,
      defaultMethod: PRO_PLAN.defaultMethod,
      timeZone: PRO_PLAN.timeZone,
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