import Restaurant from '@/models/Restaurant';
import Subscription from '@/models/Subscription';
import { initializeDatabase } from '@/lib/database-service';

/**
 * Returns the latest ACTIVE subscription for a restaurant that has not yet
 * expired (endDate is missing or in the future). null otherwise.
 */
export async function getActiveSubscription(restaurantId: string) {
  await initializeDatabase();
  const now = new Date();
  return Subscription.findOne({
    restaurantId,
    status: 'active',
    $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gte: now } }],
  });
}

/**
 * True when the restaurant has an active, unexpired subscription and its
 * membership flag is 'pro'. When the flag says 'pro' but the subscription has
 * lapsed (expired/missing/cancelled), the restaurant is automatically
 * downgraded to 'free' and stale active subscriptions are marked 'expired'.
 * This is the server-side enforcement point shared by gated API routes.
 */
export async function hasProAccess(restaurantId: string): Promise<boolean> {
  await initializeDatabase();

  const restaurant = await Restaurant.findOne({ id: restaurantId });
  if (!restaurant) return false;

  if (restaurant.membership !== 'pro') return false;

  const active = await getActiveSubscription(restaurantId);
  if (active) return true;

  // Subscription lapsed — downgrade so gated features stop being served.
  await Restaurant.updateOne({ id: restaurantId }, { $set: { membership: 'free' } });
  await Subscription.updateMany(
    { restaurantId, status: 'active' },
    { $set: { status: 'expired' } }
  );
  return false;
}

/**
 * Gating helper for API routes. Returns null when access is granted, or a
 * { status, error } response object to return as JSON when the caller does not
 * have Pro access.
 */
export async function requireProAccess(
  restaurantId: string
): Promise<{ status: number; error: string } | null> {
  const granted = await hasProAccess(restaurantId);
  if (granted) return null;
  return {
    status: 403,
    error: 'Pro subscription required to access this feature',
  };
}

/**
 * True when the given owner has Pro access on at least one of their
 * restaurants. Used to gate the "create a second restaurant" action.
 */
export async function ownerHasProAccess(ownerId: string): Promise<boolean> {
  await initializeDatabase();
  const owned = await Restaurant.find({ ownerId });
  for (const restaurant of owned) {
    if (await hasProAccess(restaurant.id)) return true;
  }
  return false;
}

/**
 * Returns how many restaurants the owner currently has. Free accounts are
 * limited to one; creating additional locations requires Pro.
 */
export async function countOwnedRestaurants(ownerId: string): Promise<number> {
  await initializeDatabase();
  return Restaurant.countDocuments({ ownerId });
}