import { NextResponse } from 'next/server';
import Subscription from '@/models/Subscription';
import Restaurant from '@/models/Restaurant';
import { initializeDatabase } from '@/lib/database-service';
import { SUBSCRIPTION_GRACE_MS, billingPeriod } from '@/lib/subscription';
import debug from 'debug';

const log = debug('chefcito:payphone:reconcile');

/**
 * Response structure from PayPhone transaction status API.
 */
interface PayphoneTransactionStatus {
  statusCode?: string;
  status?: string;
  amount?: number;
  clientTransactionId?: string;
  transactionId?: string;
}

/**
 * GET /api/subscriptions/reconcile
 *
 * Finds all pending subscriptions older than 10 minutes and checks their
 * actual payment status via PayPhone's Confirm API. Activates any that
 * were approved but not yet activated.
 *
 * Protected with an admin key (sent as `x-admin-key` header) matching
 * `RECONCILE_ADMIN_KEY`. The endpoint runs as a scheduled job; keep the
 * value secret and rotate it if it leaks.
 */
export async function GET(request: Request) {
  try {
    const adminKey = process.env.RECONCILE_ADMIN_KEY;
    if (!adminKey) {
      log('[Reconcile] RECONCILE_ADMIN_KEY not configured, rejecting');
      return NextResponse.json(
        { error: 'Reconciliation is not configured' },
        { status: 503 }
      );
    }

    const providedKey = request.headers.get('x-admin-key');
    if (providedKey !== adminKey) {
      log('[Reconcile] Invalid admin key, rejecting');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await initializeDatabase();

    log('[Reconcile] Starting reconciliation process...');

    // Find all pending subscriptions older than the grace period
    const graceAgo = new Date(Date.now() - SUBSCRIPTION_GRACE_MS);

    const pendingSubscriptions = await Subscription.find({
      status: 'pending',
      createdAt: { $lte: graceAgo },
    });

    log('[Reconcile] Found', pendingSubscriptions.length, 'pending subscriptions older than', SUBSCRIPTION_GRACE_MS, 'ms');

    const results = {
      total: pendingSubscriptions.length,
      activated: 0,
      cancelled: 0,
      stillPending: 0,
      errors: 0,
      details: [] as Array<Record<string, unknown>>,
    };

    const payphoneToken = process.env.PAYPHONE_TOKEN;

    for (const subscription of pendingSubscriptions) {
      try {
        log('[Reconcile] Checking subscription:', subscription._id, 'clientTransactionId:', subscription.clientTransactionId);

        // Try to get actual payment status from PayPhone
        let payphoneStatus: PayphoneTransactionStatus | null = null;

        if (payphoneToken) {
          try {
            // Build request body - prefer the actual PayPhone transaction ID if saved
            const confirmBody: Record<string, unknown> = {
              clientTxId: subscription.clientTransactionId,
            };

            if (subscription.payphoneTransactionId) {
              confirmBody.id = parseInt(subscription.payphoneTransactionId, 10);
              log('[Reconcile] Using saved payphoneTransactionId:', subscription.payphoneTransactionId, 'for', subscription.clientTransactionId);
            } else {
              log('[Reconcile] No payphoneTransactionId saved, calling Confirm API with clientTxId only for', subscription.clientTransactionId);
            }

            const confirmResponse = await fetch(
              'https://pay.payphonetodoesposible.com/api/button/V2/Confirm',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${payphoneToken}`,
                },
                body: JSON.stringify(confirmBody),
              }
            );

            if (confirmResponse.ok) {
              payphoneStatus = await confirmResponse.json();
              log('[Reconcile] PayPhone status for', subscription.clientTransactionId, ':', payphoneStatus?.statusCode, '(hadTransactionId:', !!subscription.payphoneTransactionId, ')');
            } else {
              log('[Reconcile] PayPhone Confirm API failed with status:', confirmResponse.status, 'for', subscription.clientTransactionId);
            }
          } catch (err) {
            log('[Reconcile] Error calling PayPhone Confirm API:', err);
          }
        }

        // Determine action based on PayPhone status
        const statusCode = payphoneStatus?.statusCode;

        if (statusCode === '3') {
          // Payment was approved - activate the subscription
          const period = billingPeriod();

          subscription.status = 'active';
          subscription.startDate = period.startDate;
          subscription.endDate = period.endDate;
          subscription.nextBillingDate = period.nextBillingDate;
          if (payphoneStatus?.transactionId) {
            subscription.payphoneTransactionId = payphoneStatus.transactionId;
          }
          await subscription.save();

          // Update restaurant membership
          const restaurant = await Restaurant.findOne({ id: subscription.restaurantId });
          if (restaurant && restaurant.membership !== 'pro') {
            restaurant.membership = 'pro';
            await restaurant.save();
            log('[Reconcile] Restaurant membership updated to pro:', restaurant.id);
          }

          results.activated++;
          results.details.push({
            clientTransactionId: subscription.clientTransactionId,
            action: 'activated',
            previousStatus: 'pending',
            newStatus: 'active',
          });

          log('[Reconcile] Subscription activated:', subscription.clientTransactionId);
        } else if (statusCode === '2') {
          // Payment was cancelled
          subscription.status = 'cancelled';
          subscription.cancelledAt = new Date();
          subscription.cancellationReason = 'Pago cancelado (reconciliación automática)';
          await subscription.save();

          results.cancelled++;
          results.details.push({
            clientTransactionId: subscription.clientTransactionId,
            action: 'cancelled',
            previousStatus: 'pending',
            newStatus: 'cancelled',
          });

          log('[Reconcile] Subscription cancelled:', subscription.clientTransactionId);
        } else {
          // Still pending or unknown status
          results.stillPending++;
          results.details.push({
            clientTransactionId: subscription.clientTransactionId,
            action: 'no_action',
            previousStatus: 'pending',
            payphoneStatusCode: statusCode || 'unknown',
          });

          log('[Reconcile] Subscription still pending or unknown status:', subscription.clientTransactionId, 'statusCode:', statusCode);
        }
      } catch (error) {
        results.errors++;
        results.details.push({
          clientTransactionId: subscription.clientTransactionId,
          action: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        log('[Reconcile] Error processing subscription:', subscription.clientTransactionId, error);
      }
    }

    log('[Reconcile] Reconciliation complete. Results:', JSON.stringify(results, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Reconciliación completada',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    log('[Reconcile] Unhandled error:', error);
    console.error('[Subscription Reconcile] Error:', error);
    return NextResponse.json(
      { error: 'Error durante la reconciliación', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
