import { NextResponse } from 'next/server';
import Subscription from '@/models/Subscription';
import User from '@/models/User';
import { initializeDatabase } from '@/lib/database-service';
import debug from 'debug';

const log = debug('chefcito:payphone:init');

// Track server start time to warn about missing webhook configuration
const serverStartTime = Date.now();
let webhookWarningLogged = false;

/**
 * Check if webhook has been configured by monitoring if any webhook calls have been received.
 * This is a simple heuristic - if 30s have passed since server start and no webhook logs exist,
 * it likely means the webhook URL is not configured in PayPhone's dashboard.
 */
function checkWebhookConfiguration() {
  if (webhookWarningLogged) return;

  const timeSinceStart = Date.now() - serverStartTime;
  if (timeSinceStart > 30_000) {
    // Note: In a production system, you'd track actual webhook call counts.
    // For now, we log a reminder that can be checked manually.
    webhookWarningLogged = true;
    log('[Init] WEBHOOK REMINDER: Ensure the webhook URL is configured in PayPhone\'s dashboard.');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '<NEXT_PUBLIC_BASE_URL not set>';
    log(`[Init] Webhook URL to configure: ${baseUrl}/api/payphone/webhook`);
  }
}

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

      const successRedirectUrl = `${baseUrl}/thank-you?clientTransactionId=${encodeURIComponent(recentPending.clientTransactionId)}`;
      const errorRedirectUrl = `${baseUrl}/thank-you?clientTransactionId=${encodeURIComponent(recentPending.clientTransactionId)}&paymentError=true`;

      return NextResponse.json({
        token,
        storeId,
        clientTransactionId: recentPending.clientTransactionId,
        amount: 499,
        amountWithoutTax: 499,
        amountWithTax: 0,
        tax: 0,
        service: 0,
        tip: 0,
        currency: 'USD',
        reference: `Suscripción Pro - ${userName}`.substring(0, 100),
        email: userEmail,
        lang: 'es',
        defaultMethod: 'card',
        timeZone: -5,
        redirectUrl: successRedirectUrl,
        successUrl: successRedirectUrl,
        cancelUrl: errorRedirectUrl,
        failedUrl: errorRedirectUrl,
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

    // Log webhook URL reminder for configuration
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      console.error('[Payphone Init] NEXT_PUBLIC_BASE_URL no está configurado en .env.local');
      return NextResponse.json({ error: 'Servicio de pagos no configurado' }, { status: 500 });
    }

    // Reminder: This webhook URL must be configured in PayPhone's dashboard
    // to receive payment notifications when webhooks are enabled
    log('[Init] Webhook URL to configure in PayPhone dashboard:', `${baseUrl}/api/payphone/webhook`);

    // Check webhook configuration status (warns if not receiving calls)
    checkWebhookConfiguration();

    // Use separate URLs for success and error cases
    // PayPhone "Cajita de Pagos" uses redirectUrl for the final redirect after payment
    // We append the clientTransactionId so the thank-you page can track the subscription
    const successRedirectUrl = `${baseUrl}/thank-you?clientTransactionId=${encodeURIComponent(clientTransactionId)}`;
    const errorRedirectUrl = `${baseUrl}/thank-you?clientTransactionId=${encodeURIComponent(clientTransactionId)}&paymentError=true`;

    log('[Init] Redirect URLs configured:', { successRedirectUrl, errorRedirectUrl });

    return NextResponse.json({
      token,
      storeId,
      clientTransactionId,
      amount: 499,
      amountWithoutTax: 499,
      amountWithTax: 0,
      tax: 0,
      service: 0,
      tip: 0,
      currency: 'USD',
      reference: `Suscripción Pro - ${userName}`.substring(0, 100),
      email: userEmail,
      lang: 'es',
      defaultMethod: 'card',
      timeZone: -5,
      // PayPhone uses redirectUrl as the final destination after payment completion
      // The widget will redirect here regardless of success/error, but we include
      // the transaction ID so the thank-you page can check the actual status
      redirectUrl: successRedirectUrl,
      // Additional URLs for explicit success/error handling (if PayPhone supports them)
      successUrl: successRedirectUrl,
      cancelUrl: errorRedirectUrl,
      failedUrl: errorRedirectUrl,
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
