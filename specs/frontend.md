# Frontend Architecture

## Overview

The frontend of Chefcito is built with Next.js 15 using the App Router architecture. It leverages React Server Components where appropriate for optimal performance, while using Client Components when state management or interactivity is required.

## UI Components

The application uses a combination of custom components and components from Radix UI and Tailwind CSS. Key UI components include:

- **UI Library Components**: Reusable components in `src/components/ui/` including buttons, forms, tables, etc.
- **Business Logic Components**: Custom components in `src/components/` that implement specific business functionality
- **Page Components**: Feature-specific components in feature directories like `src/app/(app)/pos/components/`

## State Management

The frontend uses a hybrid approach for state management:

1. **Zustand Stores**: For global state management across components:
   - `current-order-store.ts`: Manages the current order in POS
   - `i18n-store.ts`: Handles internationalization state
   - `menu-store.ts`: Stores menu data
   - `reports-store.ts`: Manages report data
   - `restaurant-store.ts`: Stores restaurant settings
   - `user-store.ts`: Manages user session data

2. **React Component State**: For local component state management using useState and useReducer

3. **SWR**: For server state management and data fetching with built-in caching and revalidation

## Data Fetching

Data fetching is implemented using SWR (Stale-While-Revalidate) for efficient data loading, caching, and background updates. Custom hooks in the `src/hooks/` directory (not shown but implied) wrap SWR to provide typed data access for each entity type.

Key patterns:
- Standard SWR hooks for data fetching
- SWR Mutation for data updates
- Optimistic UI updates where appropriate

## Internationalization

The application supports multiple languages through a custom i18n implementation:

- Language files are stored in `src/locales/` (en.json, es.json)
- The i18n store (`src/lib/stores/i18n-store.ts`) manages the current language state and provides translation functions

## Feature Areas

### Point of Sale (POS)

Located in `src/app/(app)/pos/`, the POS system provides:
- Menu browsing by category
- Order creation and modification
- Current order management
- Payment processing

### Kitchen Display System (KDS)

Located in `src/app/(app)/kds/`, the KDS provides:
- Real-time order tracking
- Order status management
- Kitchen workflow optimization

### Order Management

Located in `src/app/(app)/orders/`, this module handles:
- Order history browsing
- Order details viewing
- Order status updates

### Reporting Dashboard

Located in `src/app/(app)/reports/`, the reporting system provides:
- Sales analytics
- Performance metrics
- Data visualization

### Restaurant Management

Located in `src/app/(app)/restaurant/`, this module handles:
- Menu management
- Category management
- Inventory management
- Staff management
- Workstation configuration

### User Profile

Located in `src/app/(app)/profile/`, this module handles:
- User profile management
- Role and permission viewing
- Account settings

## Styling

The application uses Tailwind CSS for styling with a component-based approach. The configuration can be found in `tailwind.config.ts`.

## Real-time Updates

Server-Sent Events (SSE) are used for real-time updates in the KDS to ensure kitchen staff see new orders immediately.

## Client vs Server Components

The application follows Next.js best practices by using:
- Server Components by default for data fetching and static content
- Client Components when interactivity or state management is required
- Selective hydration for optimal performance