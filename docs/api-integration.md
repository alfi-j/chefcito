# API Integration Guide

This document explains how the frontend connects to the backend API in Chefcito.

## Overview

Chefcito uses a client-server architecture where:
- The frontend is a Next.js application
- The backend consists of Next.js API routes that connect to a PostgreSQL database
- Communication between frontend and backend happens through HTTP requests

## API Client

The API client (`src/lib/api-client.ts`) is the main interface between the frontend and backend. It provides:

1. Typed methods for all API operations
2. Consistent error handling
3. Automatic JSON serialization/deserialization

### Usage Example

```typescript
import { menuItemsApi } from '@/lib/api-client';

// Fetch all menu items
const menuItems = await menuItemsApi.getAll();

// Create a new menu item
const newMenuItem = await menuItemsApi.create({
  name: 'Burger',
  price: 9.99,
  description: 'Delicious burger'
});

// Update a menu item
const updatedMenuItem = await menuItemsApi.update({
  id: '1',
  name: 'Updated Burger',
  price: 10.99,
  description: 'Even more delicious burger'
});

// Delete a menu item
await menuItemsApi.delete('1');
```

## Data Context

The `DataProvider` component (`src/context/data-context.tsx`) manages global application state:

1. Fetches initial data on app load
2. Provides data to all components via React Context
3. Handles loading and error states

Components can access data using the `useData` hook:

```typescript
import { useData } from '@/context/data-context';

export default function MyComponent() {
  const { menuItems, categories, loading } = useData();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {menuItems.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

## Hooks

Custom hooks provide business logic for specific features:

### useMenu

Manages menu-related operations like creating, updating, and deleting menu items.

### useOrders

Manages order operations like creating orders and updating order status.

### useReports

Manages reporting functionality.

## API Routes

The backend API routes are located in `src/app/api/` and follow REST conventions:

- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create a new category
- `PUT /api/categories/{id}` - Update a category
- `DELETE /api/categories/{id}` - Delete a category

Similar patterns exist for all other entities (menu-items, orders, customers, etc.).

## Error Handling

The API client automatically handles HTTP errors and throws JavaScript errors with descriptive messages. Components should use try/catch blocks when calling API methods:

```typescript
try {
  await menuItemsApi.create(newItem);
  toast.success('Item created successfully');
} catch (error) {
  toast.error('Failed to create item: ' + error.message);
}
```

## Testing

You can test the API integration by visiting `/test-api` in your browser, which provides a simple interface to test all API endpoints.