# API Module

This directory contains all the API endpoints for the Chefcito application. Each subdirectory represents a resource with its own CRUD operations.

## Structure

- `/categories` - Category management endpoints
- `/customers` - Customer management endpoints
- `/inventory` - Inventory management endpoints
- `/menu-items` - Menu item management endpoints
- `/orders` - Order management endpoints
- `/payment-methods` - Payment method management endpoints
- `/staff` - Staff management endpoints
- `/tasks` - Task management endpoints
- `/lib` - Local dependencies for the API module

## Local Dependencies

To make this API module independent from the main application, it includes its own copies of necessary dependencies:

1. `db.ts` - Database connection and query functions
2. `types.ts` - TypeScript interfaces and types

## Database

The API uses PostgreSQL as its database. All endpoints interact with the database through the `query` function provided in `lib/db.ts`.

## Usage

Each endpoint supports standard REST operations:

- `GET` - Retrieve resources
- `POST` - Create new resources
- `PUT` - Update existing resources
- `DELETE` - Remove resources

## Example

To get all categories:
```bash
curl /api/categories
```

To create a new category:
```bash
curl -X POST /api/categories -d '{"name": "Appetizers"}'
```

## Deployment

To deploy this API as a separate application:

1. This module includes its own [package.json](file:///c:/Users/AJ/Documents/Projects/chefcito-master/src/app/api/package.json) with required dependencies
2. When deploying to Vercel:
   - Set the root directory to `src/app/api`
   - Vercel will automatically install dependencies from the [package.json](file:///c:/Users/AJ/Documents/Projects/chefcito-master/src/app/api/package.json) in this directory
   - Make sure to set the `DATABASE_URL` environment variable in your Vercel project settings
3. The API will connect to your Neon database using the `DATABASE_URL` environment variable