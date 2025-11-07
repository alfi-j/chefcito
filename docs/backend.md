# Chefcito Backend Documentation

This document covers the backend architecture, API routes, data models, and implementation details of the Chefcito restaurant management system.

## Technology Stack

- **Database**: MongoDB Atlas for data persistence
- **ODM**: Mongoose for MongoDB object modeling
- **API Framework**: Next.js API routes
- **Authentication**: JWT-based authentication with NextAuth.js
- **Validation**: Mix of Mongoose built-in validation and Zod for complex validation

## Data Architecture

The application uses MongoDB Atlas as its primary data store with the following collections:
- Users: User accounts with role-based access control
- Staff: Staff member information
- Categories: Menu categories and modifier groups
- MenuItems: Food and drink items with pricing
- Orders: Customer orders with status tracking
- Inventory: Stock items with low-stock alerts
- Customers: Customer information
- PaymentMethods: Available payment options
- Workstations: Kitchen workstations configuration

## Data Models

All data operations are handled through Mongoose models defined in the `src/models/` directory:
- Category
- Customer
- Inventory
- MenuItem
- Order
- PaymentMethod
- Restaurant
- User
- Workstation

### Model Features

- Proper schema definitions with validation rules
- toJSON configuration for consistent data serialization
- Pre-save hooks for operations like password hashing
- Index definitions for optimized queries

## API Routes

API routes are implemented using Next.js API routes located in `src/app/api/`:

### Authentication Routes
- `/api/auth/login` - User authentication endpoint
- `/api/users/login` - User login endpoint

### Data Management Routes
- `/api/categories` - Category management
- `/api/customers` - Customer management
- `/api/inventory` - Inventory management
- `/api/menu` - Menu management
- `/api/menu-items` - Menu items management
- `/api/orders` - Order management
- `/api/payment-methods` - Payment methods management
- `/api/reports` - Reporting data
- `/api/restaurants` - Restaurant management
- `/api/users` - User management
- `/api/workstations` - Workstation management

### Database Management Routes
- `/api/test-db` - Database connection testing

## Database Connection Management

Centralized approach to database connection management to ensure all parts of the application use the same MongoDB Atlas connection via Mongoose:

### Connection Function

```typescript
let mongooseConnectPromise: Promise<typeof mongoose> | null = null;

export const connectToDatabase = async (): Promise<typeof mongoose> => {
  // If we're already connected, return the existing connection
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  // If we're connecting, return the existing promise
  if (mongooseConnectPromise) {
    return mongooseConnectPromise;
  }

  // Create a new connection promise
  mongooseConnectPromise = new Promise(async (resolve, reject) => {
    try {
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 10000, // 10 second timeout
      });
      console.log('Connected to MongoDB using Mongoose');
      resolve(mongoose);
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      reject(error);
    }
  });

  return mongooseConnectPromise;
};
```

## Data Service Layer

The data service layer (`src/lib/mongo-data-service.ts`) provides:

- Connection management with proper error handling
- CRUD operations for all data entities
- Data validation and transformation
- Resource cleanup and connection pooling
- Business logic implementation for complex operations

## Refactored Patterns

### API Route Approach

Refactored to use Mongoose models directly instead of custom wrapper functions:
- Uses Mongoose models directly with `.lean()` for better performance
- Eliminates unnecessary wrapper functions
- Uses industry-standard Mongoose patterns
- Better TypeScript integration

### Data Service Approach

Refactored to use standard Mongoose patterns instead of custom wrappers:
- Removed custom connection management in favor of Mongoose's built-in connection management
- Eliminated simple wrapper functions that only call Mongoose methods
- Leveraged Mongoose features like populate, virtuals, and other Mongoose features
- Focused service functions on business logic rather than data access

### Validation Approach

Refactored to use a mix of validation approaches:
- Mongoose built-in validation for data integrity at the model level
- Zod for complex validation scenarios
- Proper error handling for validation failures

### Error Handling Approach

Refactored to use industry standard error management approaches:
- Eliminated unnecessary custom error handling classes
- Used standard error handling patterns
- Implemented consistent error responses
- Added handling for specific error types (validation, database, etc.)

### API Response Approach

Refactored to use standard Next.js patterns:
- Eliminated unnecessary wrapper functions
- Simplified success responses to return data directly
- Simplified error responses to return error objects directly
- Used Next.js built-in response handling rather than custom wrapper functions

## Authentication System

The authentication system uses NextAuth.js, which is the industry standard for authentication in Next.js applications:

### Features
- Credentials provider for email/password authentication
- JWT-based session management
- Role-based access control
- Proper session handling with secure tokens

### Implementation
- NextAuth configuration with providers and callbacks
- API route handler for authentication endpoints
- Session management with secure JWT tokens
- Integration with user context for client-side access

## Workstations Collection

The workstations collection manages kitchen workstation configurations:

### Schema Structure
```javascript
{
  name: String,              // Workstation name (unique)
  states: {
    new: String,             // Name for the "new" state
    inProgress: String,      // Name for the "in progress" state
    ready: String            // Name for the "ready" state
  },
  createdAt: Date,           // Creation timestamp
  updatedAt: Date            // Last update timestamp
}
```

### Schema Validation
- Requires `name` field (string)
- Requires `states` object with `new`, `inProgress`, and `ready` fields (all strings)

### Indexes
- Unique index on `name` to prevent duplicate workstation names
- Index on `createdAt` for efficient sorting

## Available Scripts

- `npm run db:schema` - Creates all required collections and indexes
- `npm run db:init` - Populates the database with sample data
- `npm run db:test` - Tests the MongoDB connection
- `npm run db:update-workstations` - Updates the MongoDB Atlas schema to include the workstations collection
- `npm run check-duplicate-collections` - Checks for duplicate collections in the database
- `npm run fix-duplicate-collections` - Fixes duplicate collections in the database

## Troubleshooting

Common issues and solutions:

### Connection Issues
- Verify MongoDB connection string in `.env.local`
- Check that IP address is whitelisted in MongoDB Atlas
- Confirm database user credentials are correct
- Ensure MongoDB cluster is active and not paused

### Missing Collections
- Run `npm run db:schema` to create all required collections and indexes
- Verify that the database initialization completed successfully

### Data Not Loading
- Run `npm run db:init` to populate the database with sample data
- Check that the database collections exist and contain data
- Verify the database name in your connection string matches your actual database

### Performance Issues
- Check MongoDB Atlas performance metrics
- Review database indexes
- Optimize queries in the MongoDB service layer
- Consider upgrading MongoDB Atlas tier