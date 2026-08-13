/**
 * PayPhone Subscription Init & Reconcile - Security Tests
 *
 * Covers the production-hardening added to the subscription flow:
 * 1. /api/payphone/init requires a valid JWT and restaurant ownership
 * 2. /api/subscriptions/reconcile requires the x-admin-key header
 */

const mockSubscription = {
  findOne: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  updateMany: jest.fn(),
  deleteMany: jest.fn(),
};

const mockRestaurant = {
  findOne: jest.fn(),
  create: jest.fn(),
  findOneAndUpdate: jest.fn(),
};

const mockMongoose = {
  connection: {
    readyState: 1, // Already connected
  },
};

jest.mock('@/models/Subscription', () => mockSubscription);
jest.mock('@/models/Restaurant', () => mockRestaurant);
jest.mock('mongoose', () => mockMongoose);

jest.mock('@/lib/database-service', () => ({
  initializeDatabase: jest.fn().mockResolvedValue(undefined),
}));

// Mock JWT auth so we can simulate an authenticated caller without real tokens
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));

import { requireAuth } from '@/lib/auth';
import { POST as initPayment } from '@/app/api/payphone/init/route';
import { GET as runReconcile } from '@/app/api/subscriptions/reconcile/route';

const mockRequireAuth = requireAuth as jest.Mock;

describe('PayPhone Init - Production Security', () => {
  const TEST_RESTAURANT_ID = 'test-restaurant-001';
  const TEST_OWNER_ID = 'owner-001';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PAYPHONE_TOKEN = 'test_token';
    process.env.PAYPHONE_STORE_ID = 'test_store_id';

    mockRestaurant.findOne.mockResolvedValue({
      id: TEST_RESTAURANT_ID,
      name: 'Test Restaurant',
      ownerId: TEST_OWNER_ID,
    });
    mockSubscription.updateMany.mockResolvedValue({});
    mockSubscription.create.mockResolvedValue({
      _id: 'mock-sub-id',
      toObject: () => ({}),
    });
  });

  it('should reject unauthenticated requests with 401', async () => {
    mockRequireAuth.mockResolvedValue(null);

    const request = new Request('http://localhost/api/payphone/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantId: TEST_RESTAURANT_ID,
        ownerEmail: 'owner@test.com',
      }),
    });

    const response = await initPayment(request);
    expect(response.status).toBe(401);
  });

  it('should reject a non-owner caller with 403', async () => {
    mockRequireAuth.mockResolvedValue({ userId: 'some-other-user', email: 'x@test.com' });

    const request = new Request('http://localhost/api/payphone/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantId: TEST_RESTAURANT_ID,
        ownerEmail: 'owner@test.com',
      }),
    });

    const response = await initPayment(request);
    expect(response.status).toBe(403);
  });

  it('should return 404 when restaurant does not exist', async () => {
    mockRequireAuth.mockResolvedValue({ userId: TEST_OWNER_ID, email: 'owner@test.com' });
    mockRestaurant.findOne.mockResolvedValue(null);

    const request = new Request('http://localhost/api/payphone/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantId: 'nonexistent',
        ownerEmail: 'owner@test.com',
      }),
    });

    const response = await initPayment(request);
    expect(response.status).toBe(404);
  });

  it('should return 400 when required fields are missing', async () => {
    mockRequireAuth.mockResolvedValue({ userId: TEST_OWNER_ID, email: 'owner@test.com' });

    const request = new Request('http://localhost/api/payphone/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurantId: TEST_RESTAURANT_ID }),
    });

    const response = await initPayment(request);
    expect(response.status).toBe(400);
  });

  it('should create a pending subscription and return widget config for the owner', async () => {
    mockRequireAuth.mockResolvedValue({ userId: TEST_OWNER_ID, email: 'owner@test.com' });

    const request = new Request('http://localhost/api/payphone/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantId: TEST_RESTAURANT_ID,
        ownerEmail: 'owner@test.com',
      }),
    });

    const response = await initPayment(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.clientTransactionId).toMatch(/^SUB-/);
    expect(data.amount).toBe(499);
    expect(data.storeId).toBe('test_store_id');
    expect(mockSubscription.updateMany).toHaveBeenCalled();
    expect(mockSubscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        restaurantId: TEST_RESTAURANT_ID,
        status: 'pending',
        amount: 499,
      })
    );
  });

  it('should use the server-side restaurant name in the reference', async () => {
    mockRequireAuth.mockResolvedValue({ userId: TEST_OWNER_ID, email: 'owner@test.com' });

    const request = new Request('http://localhost/api/payphone/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantId: TEST_RESTAURANT_ID,
        ownerEmail: 'owner@test.com',
      }),
    });

    const response = await initPayment(request);
    const data = await response.json();
    expect(data.reference).toContain('Test Restaurant');
  });
});

describe('Subscription Reconcile - Production Security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RECONCILE_ADMIN_KEY = 'test_admin_key';
    mockSubscription.find.mockResolvedValue([]);
  });

  it('should return 401 when admin key header is missing', async () => {
    const request = new Request('http://localhost/api/subscriptions/reconcile');
    const response = await runReconcile(request);
    expect(response.status).toBe(401);
  });

  it('should return 401 when admin key header is wrong', async () => {
    const request = new Request('http://localhost/api/subscriptions/reconcile', {
      headers: { 'x-admin-key': 'wrong-key' },
    });
    const response = await runReconcile(request);
    expect(response.status).toBe(401);
  });

  it('should return 503 when RECONCILE_ADMIN_KEY is not configured', async () => {
    delete process.env.RECONCILE_ADMIN_KEY;
    const request = new Request('http://localhost/api/subscriptions/reconcile', {
      headers: { 'x-admin-key': 'anything' },
    });
    const response = await runReconcile(request);
    expect(response.status).toBe(503);
  });

  it('should run when the correct admin key is provided', async () => {
    const request = new Request('http://localhost/api/subscriptions/reconcile', {
      headers: { 'x-admin-key': 'test_admin_key' },
    });
    const response = await runReconcile(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.results.total).toBe(0);
  });
});
