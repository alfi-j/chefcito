/**
 * Shared constants and helpers for the subscription payment flow.
 * Keeps the PRO plan definition, transaction id generation, and billing
 * date math in one place so all API routes stay in sync.
 */

export const PRO_PLAN = {
  plan: 'pro' as const,
  amount: 499,
  amountWithoutTax: 499,
  currency: 'USD',
  lang: 'es',
  defaultMethod: 'card',
  timeZone: -5,
} as const;

export const SUBSCRIPTION_GRACE_MS = 10 * 60 * 1000;

export function newClientTransactionId(): string {
  // PayPhone rejects duplicate transaction ids and caps length at 50 chars.
  return `SUB-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`.substring(0, 50);
}

export function proReference(restaurantName: string): string {
  return `Suscripción Pro - ${restaurantName}`.substring(0, 100);
}

/**
 * Billing period dates for an approved payment.
 * All callers (confirm, reconcile, thank-you resolver) use this so an
 * active subscription always has the same end/nextBilling semantics.
 */
export function billingPeriod(start = new Date()): {
  startDate: Date;
  endDate: Date;
  nextBillingDate: Date;
} {
  const endDate = new Date(start);
  endDate.setDate(endDate.getDate() + 30);
  const nextBillingDate = new Date(endDate);
  return { startDate: start, endDate, nextBillingDate };
}