/**
 * Subscription Gating — Production Security Tests
 *
 * Covers the Pro-only feature enforcement:
 * 1. GET /api/reports requires auth, restaurant membership, and Pro access
 * 2. POST /api/restaurants requires auth and blocks a 2nd restaurant on the free plan
 * 3. subscription-access helper auto-downgrades expired subscriptions
 */

const mockRestaurant = Object.assign(
  jest.fn((doc: Record<string, unknown>) => {
    const saved: Record<string, unknown> = { id: 'saved-restaurant-id', ...doc };
    return {
      id: saved.id,
      ownerId: saved.ownerId,
      save: jest.fn().mockResolvedValue({ ...saved, toObject: () => saved }),
      toObject: () => saved,
    };
  }),
  {
    findOne: jest.fn(),
    find: jest.fn(),
    updateOne: jest.fn(),
    countDocuments: jest.fn(),
  }
);

const mockUser = {
  findOne: jest.fn(),
  updateOne: jest.fn(),
};

const mockSubscription = {
  findOne: jest.fn(),
  updateMany: jest.fn(),
};

jest.mock('@/models/Restaurant', () => mockRestaurant);
jest.mock('@/models/Subscription', () => mockSubscription);
jest.mock('@/models/User', () => mockUser);
jest.mock('@/models', () => ({
  Restaurant: mockRestaurant,
  User: mockUser,
}));

jest.mock('@/lib/database-service', () => ({
  initializeDatabase: jest.fn().mockResolvedValue(undefined),
  getInitialOrders: jest.fn().mockResolvedValue([]),
  getPaymentMethods: jest.fn().mockResolvedValue([{ name: 'Cash', enabled: true }]),
}));

// JWT auth is re-verified inside the handlers for authorization decisions
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));

// DB connection helpers used by the restaurants route
jest.mock('@/lib/mongo-init', () => ({
  isDatabaseConnected: jest.fn().mockReturnValue(true),
  connectToDatabase: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/seed-data', () => ({
  seedRestaurantData: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-restaurant-uuid'),
}));

import { requireAuth } from '@/lib/auth';
import { GET as getReports } from '@/app/api/reports/route';
import { POST as createRestaurant } from '@/app/api/restaurants/route';
import {
  getActiveSubscription,
  hasProAccess,
  requireProAccess,
  ownerHasProAccess,
  countOwnedRestaurants,
} from '@/lib/subscription-access';

const mockRequireAuth = requireAuth as jest.Mock;

const TEST_RESTAURANT_ID = 'restaurant-001';
const TEST_OWNER_ID = 'owner-001';

const resetMocks = () => {
  jest.clearAllMocks();
  // Reset model mocks explicitly (clearAllMocks keeps implementations set
  // by earlier tests, which leaks state across tests).
  mockRestaurant.mockReset();
  mockRestaurant.find.mockReset();
  mockRestaurant.findOne.mockReset();
  mockRestaurant.updateOne.mockReset();
  mockRestaurant.countDocuments.mockReset();
  mockUser.findOne.mockReset();
  mockUser.updateOne.mockReset();
  mockSubscription.findOne.mockReset();
  mockSubscription.updateMany.mockReset();
  // Re-apply the constructor behavior wiped by mockReset
  mockRestaurant.mockImplementation((doc: Record<string, unknown>) => {
    const saved: Record<string, unknown> = { id: 'saved-restaurant-id', ...doc };
    return {
      id: saved.id,
      ownerId: saved.ownerId,
      save: jest.fn().mockResolvedValue({ ...saved, toObject: () => saved }),
      toObject: () => saved,
    };
  });
  // Default no-data reservoir so leaked state never crosses tests
  mockRestaurant.findOne.mockResolvedValue(null);
  mockRestaurant.find.mockResolvedValue([]);
  mockRestaurant.updateOne.mockResolvedValue({});
  mockRestaurant.countDocuments.mockResolvedValue(0);
  mockSubscription.findOne.mockResolvedValue(null);
  mockSubscription.updateMany.mockResolvedValue({});
  mockUser.findOne.mockResolvedValue(null);
  mockUser.updateOne.mockResolvedValue({});
};

beforeEach(resetMocks);

describe('GET /api/reports - Pro gating', () => {

  const reportsRequest = (restaurantId = TEST_RESTAURANT_ID) =>
    new Request(`http://localhost/api/reports?restaurantId=${restaurantId}`, {
      headers: { Authorization: 'Bearer token' },
    });

  it('should reject unauthenticated requests with 401', async () => {
    mockRequireAuth.mockResolvedValue(null);

    const response = await getReports(reportsRequest());
    expect(response.status).toBe(401);
  });

  it('should reject a user who is not a member of the restaurant with 403', async () => {
    mockRequireAuth.mockResolvedValue({ userId: 'other-user', email: 'x@test.com' });
    mockUser.findOne.mockResolvedValue({
      id: 'other-user',
      restaurantId: 'unrelated-restaurant',
      restaurantIds: ['unrelated-restaurant'],
    });

    const response = await getReports(reportsRequest());
    expect(response.status).toBe(403);
  });

  it('should reject a free restaurant with 403 (no pro access)', async () => {
    mockRequireAuth.mockResolvedValue({ userId: TEST_OWNER_ID, email: 'owner@test.com' });
    mockUser.findOne.mockResolvedValue({
      id: TEST_OWNER_ID,
      restaurantId: TEST_RESTAURANT_ID,
      restaurantIds: [TEST_RESTAURANT_ID],
    });
    mockRestaurant.findOne.mockResolvedValue({
      id: TEST_RESTAURANT_ID,
      membership: 'free',
    });

    const response = await getReports(reportsRequest());
    expect(response.status).toBe(403);
  });

  it('should serve reports for a Pro restaurant', async () => {
    mockRequireAuth.mockResolvedValue({ userId: TEST_OWNER_ID, email: 'owner@test.com' });
    mockUser.findOne.mockResolvedValue({
      id: TEST_OWNER_ID,
      restaurantId: TEST_RESTAURANT_ID,
      restaurantIds: [TEST_RESTAURANT_ID],
    });
    mockRestaurant.findOne.mockResolvedValue({
      id: TEST_RESTAURANT_ID,
      membership: 'pro',
    });
    mockSubscription.findOne.mockResolvedValue({
      _id: 'sub-1',
      restaurantId: TEST_RESTAURANT_ID,
      status: 'active',
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    });

    const response = await getReports(reportsRequest());
    expect(response.status).toBe(200);
  });

  it('should require restaurantId query param with 400', async () => {
    mockRequireAuth.mockResolvedValue({ userId: TEST_OWNER_ID, email: 'owner@test.com' });

    const response = await getReports(new Request('http://localhost/api/reports', {
      headers: { Authorization: 'Bearer token' },
    }));
    expect(response.status).toBe(400);
  });
});

describe('POST /api/restaurants - ownership + free plan limit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject unauthenticated requests with 401', async () => {
    mockRequireAuth.mockResolvedValue(null);

    const response = await createRestaurant(
      new Request('http://localhost/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New' }),
      })
    );
    expect(response.status).toBe(401);
  });

  it('should reject a second restaurant on the free plan with 403', async () => {
    mockRequireAuth.mockResolvedValue({ userId: TEST_OWNER_ID, email: 'owner@test.com' });
    mockRestaurant.countDocuments.mockResolvedValue(1);
    // No restaurant owned by this user is Pro
    mockRestaurant.find.mockResolvedValue([
      { id: TEST_RESTAURANT_ID, membership: 'free' },
    ]);

    const response = await createRestaurant(
      new Request('http://localhost/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Second Location' }),
      })
    );
    expect(response.status).toBe(403);
  });

  it('should allow a Pro owner to create additional restaurants', async () => {
    mockRequireAuth.mockResolvedValue({ userId: TEST_OWNER_ID, email: 'owner@test.com' });
    mockRestaurant.countDocuments.mockResolvedValue(1);
    mockRestaurant.findOne.mockResolvedValue({
      id: TEST_RESTAURANT_ID,
      membership: 'pro',
    });
    mockRestaurant.find.mockResolvedValue([
      { id: TEST_RESTAURANT_ID, membership: 'pro' },
    ]);
    mockSubscription.findOne.mockResolvedValue({
      _id: 'sub-1',
      restaurantId: TEST_RESTAURANT_ID,
      status: 'active',
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    });

    const response = await createRestaurant(
      new Request('http://localhost/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Second Location' }),
      })
    );
    expect(response.status).toBe(200);
  });
});

describe('subscription-access helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the active subscription when endDate is in the future', async () => {
    mockSubscription.findOne.mockResolvedValue({
      _id: 'sub-1',
      status: 'active',
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    });

    const sub = await getActiveSubscription(TEST_RESTAURANT_ID);
    expect(mockSubscription.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ restaurantId: TEST_RESTAURANT_ID, status: 'active' })
    );
    expect(sub?._id).toBe('sub-1');
  });

  it('downgrades an expired pro restaurant to free', async () => {
    mockRestaurant.findOne.mockResolvedValue({
      id: TEST_RESTAURANT_ID,
      membership: 'pro',
    });
    // No active subscription remains (already lapsed)
    mockSubscription.findOne.mockResolvedValue(null);

    const granted = await hasProAccess(TEST_RESTAURANT_ID);
    expect(granted).toBe(false);
    expect(mockRestaurant.updateOne).toHaveBeenCalledWith(
      { id: TEST_RESTAURANT_ID },
      { $set: { membership: 'free' } }
    );
    expect(mockSubscription.updateMany).toHaveBeenCalledWith(
      { restaurantId: TEST_RESTAURANT_ID, status: 'active' },
      { $set: { status: 'expired' } }
    );
  });

  it('requireProAccess returns a 403 response when access is denied', async () => {
    mockRestaurant.findOne.mockResolvedValue({ id: TEST_RESTAURANT_ID, membership: 'free' });

    const denied = await requireProAccess(TEST_RESTAURANT_ID);
    expect(denied?.status).toBe(403);
  });

  it('ownerHasProAccess returns true when one owned restaurant is pro', async () => {
    mockRestaurant.findOne.mockResolvedValue({ id: 'a', membership: 'pro' });
    mockRestaurant.find.mockResolvedValue([{ id: 'a', membership: 'pro' }]);
    mockSubscription.findOne.mockResolvedValue({
      _id: 'sub-1',
      status: 'active',
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    });

    const granted = await ownerHasProAccess(TEST_OWNER_ID);
    expect(granted).toBe(true);
  });

  it('countOwnedRestaurants returns the number of restaurants owned', async () => {
    mockRestaurant.countDocuments.mockResolvedValue(2);
    const count = await countOwnedRestaurants(TEST_OWNER_ID);
    expect(count).toBe(2);
  });
});