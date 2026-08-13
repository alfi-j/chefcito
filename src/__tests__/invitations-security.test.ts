/**
 * Staff Invitations - Security Tests
 *
 * Covers the production-hardening of the invitation flow:
 * 1. POST /api/invitations requires a valid JWT, ownership (Owner/Admin or
 *    a role with user_management), validates the invited role, resolves the
 *    restaurant server-side (never from client input) and never allows
 *    inviting an Owner.
 * 2. POST /api/register/staff validates input, claims the token atomically,
 *    normalizes email/username and blocks reused/expired tokens.
 * 3. GET /api/invitations/[token] still returns 404/410 correctly.
 */

const mockInvitation = {
  findOne: jest.fn(),
  create: jest.fn(),
  findOneAndUpdate: jest.fn(),
  updateOne: jest.fn(),
};

function MockUser(this: { save: jest.Mock }, doc: Record<string, unknown>) {
  Object.assign(this, doc);
  this.save = jest.fn().mockResolvedValue({});
}

const mockUser = jest.fn(MockUser) as unknown as jest.Mock & { findOne: jest.Mock };
mockUser.findOne = jest.fn();

jest.mock('@/models/User', () => mockUser);

const mockRestaurant = {
  findOne: jest.fn(),
};

const mockRole = {
  findOne: jest.fn(),
};

const mockMongoose = {
  connection: {
    readyState: 1, // Already connected
  },
};

jest.mock('@/models/Invitation', () => mockInvitation);
jest.mock('@/models/User', () => mockUser);
jest.mock('@/models/Restaurant', () => mockRestaurant);
jest.mock('@/models/Role', () => mockRole);
jest.mock('mongoose', () => mockMongoose);

jest.mock('@/lib/database-service', () => ({
  initializeDatabase: jest.fn().mockResolvedValue(undefined),
}));

// uuid is an ESM-only package; stub it for the route imports
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-v4'),
}));

// Mock JWT auth so we can simulate an authenticated caller without real tokens
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));

import { requireAuth } from '@/lib/auth';
import { POST as createInvitation } from '@/app/api/invitations/route';
import { GET as validateInvitation } from '@/app/api/invitations/[token]/route';
import { POST as registerStaff } from '@/app/api/register/staff/route';

const mockRequireAuth = requireAuth as jest.Mock;

describe('POST /api/invitations - Production Security', () => {
  const TEST_RESTAURANT_ID = 'test-restaurant-001';
  const TEST_OWNER_ID = 'owner-001';

  const ownerUser = {
    id: TEST_OWNER_ID,
    name: 'The Owner',
    role: 'Owner',
    restaurantId: TEST_RESTAURANT_ID,
    restaurantIds: [TEST_RESTAURANT_ID],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockInvitation.create.mockResolvedValue({});
    mockRestaurant.findOne.mockResolvedValue({
      id: TEST_RESTAURANT_ID,
      name: 'Test Restaurant',
      ownerId: TEST_OWNER_ID,
    });
    mockUser.findOne.mockResolvedValue(ownerUser);
  });

  function buildRequest(body: Record<string, unknown>) {
    return new Request('http://localhost/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('should reject unauthenticated requests with 401', async () => {
    mockRequireAuth.mockResolvedValue(null);

    const response = await createInvitation(
      buildRequest({ role: 'Waiter' })
    );
    expect(response.status).toBe(401);
  });

  it('should reject a caller without user_management with 403', async () => {
    mockRequireAuth.mockResolvedValue({ userId: 'waiter-1', email: 'waiter@test.com' });
    mockUser.findOne.mockResolvedValue({
      id: 'waiter-1',
      name: 'A Waiter',
      role: 'Waiter',
      restaurantId: TEST_RESTAURANT_ID,
      restaurantIds: [TEST_RESTAURANT_ID],
    });
    // No predefined permission and no custom role grants user_management
    mockRole.findOne.mockResolvedValue(null);

    const response = await createInvitation(
      buildRequest({ role: 'Cashier' })
    );
    expect(response.status).toBe(403);
  });

  it('should reject inviting an Owner with 400', async () => {
    mockRequireAuth.mockResolvedValue({ userId: TEST_OWNER_ID, email: 'owner@test.com' });

    const response = await createInvitation(
      buildRequest({ role: 'Owner' })
    );
    expect(response.status).toBe(400);
  });

  it('should reject an unknown role with 400', async () => {
    mockRequireAuth.mockResolvedValue({ userId: TEST_OWNER_ID, email: 'owner@test.com' });
    mockRole.findOne.mockResolvedValue(null);

    const response = await createInvitation(
      buildRequest({ role: 'Floating Superuser' })
    );
    expect(response.status).toBe(400);
  });

  it('should create an invite for a valid predefined role', async () => {
    mockRequireAuth.mockResolvedValue({ userId: TEST_OWNER_ID, email: 'owner@test.com' });

    const response = await createInvitation(
      buildRequest({ role: 'Waiter' })
    );
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.link).toContain('/register?token=');
    expect(data.token).toBeTruthy();
    expect(mockInvitation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: TEST_OWNER_ID,
        restaurantId: TEST_RESTAURANT_ID,
        restaurantName: 'Test Restaurant',
        role: 'Waiter',
      })
    );
  });

  it('should resolve the restaurant server-side, ignoring client ownerId', async () => {
    mockRequireAuth.mockResolvedValue({ userId: TEST_OWNER_ID, email: 'owner@test.com' });

    const response = await createInvitation(
      buildRequest({ ownerId: 'attacker-id', role: 'Cashier' })
    );
    expect(response.status).toBe(200);

    expect(mockInvitation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: TEST_OWNER_ID,
        restaurantId: TEST_RESTAURANT_ID,
        restaurantName: 'Test Restaurant',
      })
    );
  });
});

describe('GET /api/invitations/[token] - Validation', () => {
  const TOKEN = 'invite-token-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function buildRequest() {
    return new Request('http://localhost/api/invitations/invite-token-123');
  }

  function buildParams() {
    return { params: Promise.resolve({ token: TOKEN }) };
  }

  it('should return 404 for an unknown token', async () => {
    mockInvitation.findOne.mockResolvedValue(null);

    const response = await validateInvitation(buildRequest(), buildParams());
    expect(response.status).toBe(404);
  });

  it('should return 410 for a used token', async () => {
    mockInvitation.findOne.mockResolvedValue({
      token: TOKEN,
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const response = await validateInvitation(buildRequest(), buildParams());
    expect(response.status).toBe(410);
  });

  it('should return 410 for an expired token', async () => {
    mockInvitation.findOne.mockResolvedValue({
      token: TOKEN,
      usedAt: null,
      expiresAt: new Date(Date.now() - 60 * 60 * 1000),
    });

    const response = await validateInvitation(buildRequest(), buildParams());
    expect(response.status).toBe(410);
  });

  it('should return invitation info for a valid token', async () => {
    mockInvitation.findOne.mockResolvedValue({
      token: TOKEN,
      usedAt: null,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      restaurantName: 'Test Restaurant',
      role: 'Waiter',
    });

    const response = await validateInvitation(buildRequest(), buildParams());
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.restaurantName).toBe('Test Restaurant');
    expect(data.role).toBe('Waiter');
  });
});

describe('POST /api/register/staff - Registration Security', () => {
  const TOKEN = 'invite-token-123';
  const TEST_RESTAURANT_ID = 'test-restaurant-001';

  const validInvitation = {
    token: TOKEN,
    usedAt: null,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    restaurantId: TEST_RESTAURANT_ID,
    role: 'Waiter',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockInvitation.create.mockResolvedValue({});
    // Default: a fresh, claimable invitation
    mockInvitation.findOneAndUpdate.mockResolvedValue(validInvitation);
    mockInvitation.findOne.mockResolvedValue(validInvitation);
    mockUser.findOne.mockResolvedValue(null);
  });

  function buildRequest(body: Record<string, unknown>) {
    return new Request('http://localhost/api/register/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('should reject a missing token with 400', async () => {
    const response = await registerStaff(
      buildRequest({ username: 'jane', password: 'password123' })
    );
    expect(response.status).toBe(400);
  });

  it('should reject a short password with 400', async () => {
    const response = await registerStaff(
      buildRequest({ token: TOKEN, username: 'jane', password: '123' })
    );
    expect(response.status).toBe(400);
  });

  it('should reject an unknown token with 404', async () => {
    mockInvitation.findOneAndUpdate.mockResolvedValue(null);
    mockInvitation.findOne.mockResolvedValue(null);

    const response = await registerStaff(
      buildRequest({ token: TOKEN, username: 'jane', password: 'password123' })
    );
    expect(response.status).toBe(404);
  });

  it('should reject an already-used token with 410', async () => {
    mockInvitation.findOneAndUpdate.mockResolvedValue(null);
    mockInvitation.findOne.mockResolvedValue({ ...validInvitation, usedAt: new Date() });

    const response = await registerStaff(
      buildRequest({ token: TOKEN, username: 'jane', password: 'password123' })
    );
    expect(response.status).toBe(410);
  });

  it('should reject an expired token with 410', async () => {
    mockInvitation.findOneAndUpdate.mockResolvedValue(null);
    mockInvitation.findOne.mockResolvedValue({
      ...validInvitation,
      expiresAt: new Date(Date.now() - 60 * 60 * 1000),
    });

    const response = await registerStaff(
      buildRequest({ token: TOKEN, username: 'jane', password: 'password123' })
    );
    expect(response.status).toBe(410);
  });

  it('should reject a duplicate username (case-insensitive) with 409', async () => {
    mockUser.findOne.mockResolvedValue({ id: 'someone-else', username: 'JANE' });

    const response = await registerStaff(
      buildRequest({ token: TOKEN, username: 'jane', password: 'password123' })
    );
    expect(response.status).toBe(409);
  });

  it('should reject a duplicate email with 409', async () => {
    mockUser.findOne
      .mockResolvedValueOnce(null) // username check
      .mockResolvedValueOnce({ id: 'someone-else', email: 'jane@test.com' }); // email check

    const response = await registerStaff(
      buildRequest({ token: TOKEN, username: 'jane', password: 'password123', email: 'Jane@test.com' })
    );
    expect(response.status).toBe(409);
  });

  it('should create an account and claim the token atomically', async () => {
    const response = await registerStaff(
      buildRequest({
        token: TOKEN,
        username: '  jane_doe  ',
        password: 'password123',
        email: '  JANE@TEST.COM  ',
      })
    );
    expect(response.status).toBe(201);

    expect(mockInvitation.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ token: TOKEN, usedAt: null }),
      expect.objectContaining({ $set: expect.objectContaining({ usedAt: expect.any(Date) }) }),
      expect.objectContaining({ new: true })
    );
  });
});
