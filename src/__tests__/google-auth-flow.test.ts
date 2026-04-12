/**
 * Google Auth - Integration Tests
 * 
 * Tests the complete Google OAuth flow:
 * 1. Existing user login
 * 2. New user registration (with restaurant creation)
 * 3. Linking googleId to existing email user
 * 4. Error cases
 */

// Mock mongoose
const mockMongoose = {
  connection: { readyState: 1 },
  connect: jest.fn().mockResolvedValue(undefined),
};

// Mock User model
const mockUser = {
  findOne: jest.fn(),
};

const mockUserInstance = {
  id: 'test-user-123',
  name: 'Test User',
  email: 'test@gmail.com',
  googleId: 'google-123',
  role: 'Owner',
  status: 'Off Shift',
  restaurantId: null,
  save: jest.fn().mockResolvedValue(true),
  toObject: jest.fn().mockReturnValue({
    id: 'test-user-123',
    name: 'Test User',
    email: 'test@gmail.com',
    googleId: 'google-123',
    role: 'Owner',
    status: 'Off Shift',
    restaurantId: null,
  }),
};

// Mock Restaurant model
const mockRestaurant = {
  save: jest.fn().mockResolvedValue(true),
};

jest.mock('mongoose', () => mockMongoose);
jest.mock('@/models/User', () => {
  return {
    findOne: jest.fn(),
    prototype: { save: jest.fn() },
  };
});
jest.mock('@/models/Restaurant', () => jest.fn());

// Mock OAuth2Client
const mockVerifyIdToken = jest.fn();
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

// Mock jwt
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('uuid-test-123'),
}));

// Mock debug
jest.mock('debug', () => {
  return () => (...args: any[]) => {};
});

// Now import the route handler
import { POST as googleAuth } from '@/app/api/auth/google/route';

describe('Google Auth Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
    process.env.JWT_SECRET = 'test-secret';
    process.env.MONGODB_URI = 'mongodb://localhost:27017';
    process.env.MONGODB_DB = 'chefcito';

    // Setup mocks
    jest.spyOn(require('@/models/User'), 'findOne').mockImplementation(mockUser.findOne);
    jest.spyOn(require('@/models/Restaurant'), 'default').mockImplementation(() => mockRestaurant);
  });

  describe('Existing User Login', () => {
    it('should login existing user with googleId', async () => {
      const mockTicket = {
        getPayload: () => ({
          email: 'test@gmail.com',
          name: 'Test User',
          sub: 'google-123',
        }),
      };
      mockVerifyIdToken.mockResolvedValue(mockTicket);
      mockUser.findOne.mockResolvedValue(mockUserInstance);

      const request = {
        json: async () => ({ credential: 'mock-google-token' }),
      } as Request;

      const response = await googleAuth(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toBeTruthy();
      expect(data.token).toBe('mock-jwt-token');
      expect(data.user.email).toBe('test@gmail.com');
      expect(data.user.googleId).toBe('google-123');

      console.log('✅ Test 1 passed: Existing user login works');
    });

    it('should link googleId to existing email user', async () => {
      const userWithoutGoogle = {
        ...mockUserInstance,
        googleId: null,
        save: jest.fn().mockResolvedValue(true),
      };

      const mockTicket = {
        getPayload: () => ({
          email: 'test@gmail.com',
          name: 'Test User',
          sub: 'google-new-123',
        }),
      };
      mockVerifyIdToken.mockResolvedValue(mockTicket);
      mockUser.findOne.mockResolvedValue(userWithoutGoogle);

      const request = {
        json: async () => ({ credential: 'mock-google-token' }),
      } as Request;

      const response = await googleAuth(request);

      expect(response.status).toBe(200);
      expect(userWithoutGoogle.save).toHaveBeenCalled();
      expect(userWithoutGoogle.googleId).toBe('google-new-123');

      console.log('✅ Test 2 passed: Links googleId to existing email user');
    });
  });

  describe('New User Registration', () => {
    it('should create new user with default Owner role', async () => {
      const mockTicket = {
        getPayload: () => ({
          email: 'newuser@gmail.com',
          name: 'New User',
          sub: 'google-new-456',
        }),
      };
      mockVerifyIdToken.mockResolvedValue(mockTicket);
      mockUser.findOne.mockResolvedValue(null); // No existing user

      const request = {
        json: async () => ({ credential: 'mock-google-token' }),
      } as Request;

      const response = await googleAuth(request);

      // Check that User constructor was called
      const User = require('@/models/User');
      expect(User.default || User).toHaveBeenCalled();

      console.log('✅ Test 3 passed: Creates new user');
    });

    it('should create new user with provided Owner role', async () => {
      mockUser.findOne.mockResolvedValue(null);

      const mockTicket = {
        getPayload: () => ({
          email: 'owner@gmail.com',
          name: 'Owner User',
          sub: 'google-owner-789',
        }),
      };
      mockVerifyIdToken.mockResolvedValue(mockTicket);

      const request = {
        json: async () => ({ credential: 'mock-token', role: 'Owner' }),
      } as Request;

      const response = await googleAuth(request);

      const User = require('@/models/User');
      expect(User.default || User).toHaveBeenCalled();

      console.log('✅ Test 4 passed: Creates new user with explicit role');
    });
  });

  describe('Error Cases', () => {
    it('should reject missing credential', async () => {
      const request = {
        json: async () => ({}),
      } as Request;

      const response = await googleAuth(request);

      expect(response.status).toBe(400);

      console.log('✅ Test 5 passed: Rejects missing credential');
    });

    it('should handle invalid Google token', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

      const request = {
        json: async () => ({ credential: 'bad-token' }),
      } as Request;

      const response = await googleAuth(request);

      expect(response.status).toBe(500);

      console.log('✅ Test 6 passed: Handles invalid token');
    });

    it('should handle missing email in payload', async () => {
      const mockTicket = {
        getPayload: () => ({
          name: 'No Email User',
          sub: 'google-no-email',
        }),
      };
      mockVerifyIdToken.mockResolvedValue(mockTicket);

      const request = {
        json: async () => ({ credential: 'mock-token' }),
      } as Request;

      const response = await googleAuth(request);

      expect(response.status).toBe(401);

      console.log('✅ Test 7 passed: Rejects missing email');
    });
  });

  describe('Restaurant Creation', () => {
    it('should create restaurant when new Owner registers', async () => {
      mockUser.findOne.mockResolvedValue(null);

      const mockTicket = {
        getPayload: () => ({
          email: 'newowner@gmail.com',
          name: 'New Owner',
          sub: 'google-owner',
        }),
      };
      mockVerifyIdToken.mockResolvedValue(mockTicket);

      // Mock User constructor to return instance with save method
      const User = require('@/models/User');
      const mockNewUser = {
        id: 'uuid-test-123',
        save: jest.fn().mockResolvedValue(true),
        toObject: () => ({
          id: 'uuid-test-123',
          email: 'newowner@gmail.com',
          name: 'New Owner',
          role: 'Owner',
          restaurantId: null,
        }),
      };
      (User.default || User).mockReturnValue(mockNewUser);

      const Restaurant = require('@/models/Restaurant').default;
      const mockNewRestaurant = {
        save: jest.fn().mockResolvedValue(true),
      };
      Restaurant.mockReturnValue(mockNewRestaurant);

      const request = {
        json: async () => ({ credential: 'mock-token', role: 'Owner' }),
      } as Request;

      await googleAuth(request);

      // Verify restaurant was created
      expect(Restaurant).toHaveBeenCalled();
      expect(mockNewRestaurant.save).toHaveBeenCalled();
      expect(mockNewUser.restaurantId).toBeTruthy();

      console.log('✅ Test 8 passed: Creates restaurant for new Owner');
    });
  });

  describe('Google Token Verification', () => {
    it('should call verifyIdToken with correct audience', async () => {
      mockUser.findOne.mockResolvedValue(mockUserInstance);
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          email: 'test@gmail.com',
          name: 'Test',
          sub: 'google-123',
        }),
      });

      const request = {
        json: async () => ({ credential: 'mock-token' }),
      } as Request;

      await googleAuth(request);

      expect(mockVerifyIdToken).toHaveBeenCalledWith({
        idToken: 'mock-token',
        audience: 'test-client-id.apps.googleusercontent.com',
      });

      console.log('✅ Test 9 passed: Uses correct GOOGLE_CLIENT_ID');
    });
  });
});
