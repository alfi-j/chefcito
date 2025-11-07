# Backend Architecture

## Overview

The backend of Chefcito is built with Next.js API routes, using MongoDB as the primary data store. It follows a service-oriented approach with clear separation between data models, service layers, and API endpoints.

## Data Models

All data models are defined in the `src/models/` directory using TypeScript interfaces and Mongoose-like schemas:

- **Category.ts**: Menu categories and modifier groups
- **Customer.ts**: Customer information
- **Inventory.ts**: Stock items with low-stock alerts
- **MenuItem.ts**: Food and drink items with pricing
- **Order.ts**: Customer orders with status tracking
- **Payment.ts**: Available payment options
- **PaymentMethod.ts**: Payment methods model
- **Restaurant.ts**: Restaurant information and settings
- **User.ts**: User accounts with role-based access control
- **Workstation.ts**: Restaurant workstations configuration

## API Routes

API routes are organized in `src/app/api/` following a RESTful pattern:

- **auth/**: Authentication endpoints
- **categories/**: Category management
- **customers/**: Customer data management
- **inventory/**: Stock and inventory management
- **menu/**: Menu structure endpoints
- **menu-items/**: Individual menu item management
- **orders/**: Order processing and management
- **payments/**: Payment configuration
- **reports/**: Reporting data endpoints
- **restaurants/**: Restaurant settings endpoints
- **users/**: User management endpoints
- **workstations/**: Workstation configuration endpoints

Each route typically implements standard CRUD operations:
- `GET /api/resource` - List resources
- `GET /api/resource/[id]` - Get specific resource
- `POST /api/resource` - Create new resource
- `PUT /api/resource/[id]` - Update specific resource
- `DELETE /api/resource/[id]` - Delete specific resource

## Service Layer

The service layer in `src/lib/` provides a clean abstraction between the API routes and database operations:

- **data-service.ts**: Primary service layer coordinating all data operations
- **mongo-data-service.ts**: MongoDB-specific implementation
- **data-utils.ts**: Utility functions for data processing
- **mongodb.ts**: MongoDB connection and configuration

## Database Operations

The application uses MongoDB with the following key patterns:

1. **Connection Management**: Centralized connection handling with proper error handling
2. **Schema Validation**: TypeScript types for all data entities
3. **Indexing**: Properly configured indexes for performance
4. **Query Optimization**: Efficient query patterns for common operations

## Authentication

Authentication is handled through:
- Session-based authentication with secure HTTP-only cookies
- Protected routes using middleware (`src/middleware.ts`)
- Role-based access control for different user types (Admin, Restaurant Owner, Staff)

## Error Handling

API routes implement consistent error handling:
- Standardized error response format
- Proper HTTP status codes
- Detailed error logging
- Graceful degradation for non-critical failures

## Data Validation

Data validation is performed at multiple levels:
- TypeScript types for compile-time checking
- Runtime validation for API inputs
- Database-level validation through schema definitions

## Scripts

Utility scripts in the `scripts/` directory help with database management:
- **check-duplicate-collections.mjs**: Identifies duplicate collections
- **fix-duplicate-collections.mjs**: Fixes duplicate collection issues
- **test-payments.js**: Tests the payments API (placeholder - to be implemented)
- **update-workstations-schema.mjs**: Updates workstation schema

## Security Considerations

- Input validation and sanitization
- Protected API endpoints with authentication checks
- Role-based access control
- Secure session management
- Environment-based configuration for sensitive data