# Chefcito Frontend Documentation

This document covers the frontend architecture, components, and implementation details of the Chefcito restaurant management system.

## Technology Stack

- **Framework**: Next.js 15 with React Server Components and App Router
- **UI Components**: Tailwind CSS, Radix UI, and custom components
- **State Management**: Zustand for client-side state management
- **Data Fetching**: SWR (Stale-While-Revalidate) for efficient data fetching
- **Internationalization**: Custom i18n solution with Zustand store
- **Real-time Updates**: Server-Sent Events (SSE) for live data synchronization

## Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── (app)/          # Main application pages
│   │   ├── components/ # Shared components for app pages
│   │   ├── kds/        # Kitchen Display System pages
│   │   ├── orders/     # Orders management pages
│   │   ├── pos/        # Point of Sale pages
│   │   ├── profile/    # User profile pages
│   │   ├── reports/    # Reporting dashboard pages
│   │   └── restaurant/ # Restaurant management pages
│   ├── api/            # API routes
│   └── login/          # Login page
├── components/          # Reusable UI components
│   ├── ui/             # Shared UI components (buttons, cards, etc.)
│   └── ...             # Domain-specific components
├── context/            # React context providers
├── lib/                # Library and utility functions
│   ├── stores/         # Zustand stores for state management
│   └── ...             # Other utility functions
├── locales/            # Internationalization files
└── hooks/              # Custom React hooks
```

## UI Components

### Custom Components

1. **OrderItemCard** - Implements specific order management UI with business logic for managing order items in the POS system
2. **OrderItemDisplay** - Implements KDS-specific status tracking and visualization
3. **MembershipManager** - Manages user membership features
4. **RoleManager** - Handles user role management
5. **UserInfo** - Displays user-specific information

### Component Library Integration

All custom components properly use the existing UI library components such as:
- Card, CardContent, CardFooter, CardHeader, CardTitle
- Button
- ScrollArea
- And other Radix UI components

## Data Fetching

The application uses SWR (Stale-While-Revalidate) for data fetching with the following patterns:

### Standard SWR Hooks

```typescript
// Standard SWR hook with mutations
import useSWR, { useSWRConfig } from 'swr';
import useSWRMutation from 'swr/mutation';

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json());

// Mutation functions
const sendRequest = (url: string, { arg }: { arg: any }) => 
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg)
  }).then(res => res.json());
```

### Domain-Specific Hooks

Custom hooks are created for domain-specific data fetching with proper error handling and caching.

## Internationalization

The application uses a custom i18n solution with Zustand store that:
- Supports English and Spanish out of the box
- Is easily extensible to other languages
- Provides context-based translations
- Handles dynamic content translation

## Real-time Updates

Server-Sent Events (SSE) are used for real-time updates in:
- Order status tracking in KDS
- Live inventory updates
- Real-time reporting data

## Authentication

The authentication system:
- Uses JWT tokens for session management
- Stores tokens in both localStorage (for client-side access) and as HTTP cookies (for middleware access)
- Implements role-based access control
- Handles middleware protection for pages

## Refactored Patterns

### Data Fetching Hooks Approach

Standardized to use SWR for data fetching and mutations rather than mixing custom state management with SWR, resulting in more consistent, maintainable, and performant data fetching hooks.

### UI Components Approach

Maintains valuable domain-specific components while eliminating unnecessary wrappers and promoting standardization through the existing component library.

### Utility Functions Approach

Uses a combination of:
- Domain-specific utility functions for business logic
- Lodash for generic operations like array manipulation, object handling, etc.
- Native JavaScript methods for simple operations

## Error Handling

Standard error handling patterns:
- Direct console logging with structured data
- Standardized error responses
- Specific error handling for different error types (validation, database, etc.)
- Environment-based error details (more verbose in development)

## Validation

Uses a mixed approach:
- Mongoose built-in validation for data integrity at the model level
- Zod for client-side validation where needed
- Proper error handling for validation failures