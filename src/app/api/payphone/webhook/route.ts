import { NextResponse } from 'next/server';
import Subscription from '@/models/Subscription';
import User from '@/models/User';
import { initializeDatabase } from '@/lib/database-service';
import debug from 'debug';

const log = debug('chefcito:payphone:webhook');

/**
 * Payload structure that PayPhone sends to the webhook endpoint.
 */
interface PayphoneWebhookPayload {
  clientTransactionId: string;
  transactionId?: string;
  statusCode: string; // "3" = approved, "2" = cancelled
  amount?: number;
  currency?: string;
  reference?: string;
}

/**
 * POST /api/payphone/webhook
 *
 * Receives payment notifications from PayPhone when a payment completes.
 * This endpoint is idempotent - multiple calls with the same data are safe.
 *
 * PayPhone statusCode values:
 * - "3" = Approved (activate subscription)
 * - "2" = Cancelled (mark subscription as cancelled)
 */
export async function POST(request: Request) {
  try {
    await initializeDatabase();

    let payload: PayphoneWebhookPayload;

    try {
      const body = await request.json();
      payload = body as PayphoneWebhookPayload;
    } catch {
      log('[Webhook] Invalid JSON payload received');
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    log('[Webhook] Received payload:', JSON.stringify(payload, null, 2));

    const { clientTransactionId, transactionId, statusCode } = payload;

    // Validate required fields
    if (!clientTransactionId || !statusCode) {
      log('[Webhook] Missing required fields: clientTransactionId or statusCode');
      return NextResponse.json(
        { error: 'clientTransactionId and statusCode are required' },
        { status: 400 }
      );
    }

    // Validate statusCode is a known terminal state
    if (!['2', '3'].includes(statusCode)) {
      log('[Webhook] Non-terminal statusCode received:', statusCode);
      return NextResponse.json(
        { message: 'Non-terminal status received, ignoring', statusCode },
        { status: 200 }
      );
    }

    // Find the subscription by clientTransactionId
    const subscription = await Subscription.findOne({ clientTransactionId });

    if (!subscription) {
      log('[Webhook] Subscription not found for clientTransactionId:', clientTransactionId);
      return NextResponse.json(
        { error: 'Subscription not found', clientTransactionId },
        { status: 404 }
      );
    }

    log('[Webhook] Found subscription:', subscription._id, 'current status:', subscription.status);

    // Handle approved payment (statusCode = "3")
    if (statusCode === '3') {
      // Idempotency: if already active, skip activation
      if (subscription.status === 'active') {
        log('[Webhook] Subscription already active, skipping activation (idempotent)');
        return NextResponse.json({
          message: 'Subscription already active',
          clientTransactionId,
          status: 'active',
        });
      }

      const now = new Date();
      const nextBillingDate = new Date(now);
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

      // Update subscription
      subscription.status = 'active';
      subscription.startDate = now;
      subscription.endDate = nextBillingDate;
      subscription.nextBillingDate = nextBillingDate;
      if (transactionId) {
        subscription.payphoneTransactionId = transactionId;
      }
      await subscription.save();

      log('[Webhook] Subscription activated:', subscription._id);

      // Update user membership to pro
      const user = await User.findOne({ id: subscription.userId });
      if (user) {
        if (user.membership !== 'pro') {
          user.membership = 'pro';
          await user.save();
          log('[Webhook] User membership updated to pro:', user.id);
        } else {
          log('[Webhook] User membership already pro, skipping update');
        }
      } else {
        log('[Webhook] WARNING: User not found for subscription:', subscription.userId);
      }

      return NextResponse.json({
        message: 'Subscription activated successfully',
        clientTransactionId,
        status: 'active',
        nextBillingDate,
      });
    }

    // Handle cancelled payment (statusCode = "2")
    if (statusCode === '2') {
      // Idempotency: if already cancelled, skip
      if (subscription.status === 'cancelled') {
        log('[Webhook] Subscription already cancelled, skipping (idempotent)');
        return NextResponse.json({
          message: 'Subscription already cancelled',
          clientTransactionId,
          status: 'cancelled',
        });
      }

      subscription.status = 'cancelled';
      subscription.cancelledAt = new Date();
      subscription.cancellationReason = 'Pago cancelado o fallido (webhook)';
      if (transactionId) {
        subscription.payphoneTransactionId = transactionId;
      }
      await subscription.save();

      log('[Webhook] Subscription cancelled:', subscription._id);

      return NextResponse.json({
        message: 'Subscription marked as cancelled',
        clientTransactionId,
        status: 'cancelled',
      });
    }

    // Should never reach here due to earlier validation
    log('[Webhook] Unexpected statusCode:', statusCode);
    return NextResponse.json(
      { message: 'Unhandled statusCode', statusCode },
      { status: 200 }
    );
  } catch (error) {
    log('[Webhook] Unhandled error:', error);
    console.error('[Payphone Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
