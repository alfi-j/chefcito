# Order Position Syncing Implementation

This document explains how to use the order position syncing functionality that was implemented for the KDS (Kitchen Display System).

## Components Created

### 1. Database Migration Script
- File: `scripts/migrate-order-position-table.ts`
- Creates the `order_position` table in your Neon database
- Includes proper indexes for performance

### 2. API Endpoints
Located at `/api/order-positions`:
- GET `/api/order-positions?tabName=...` - Retrieve positions for a tab
- POST `/api/order-positions` - Save a single position
- PUT `/api/order-positions/batch` - Save multiple positions

### 3. KDS Integration
Updated `src/app/(app)/kds/page.tsx` with:
- Local storage persistence
- Database syncing functionality
- Visual indicators for sync status

### 4. Test Scripts
- `scripts/test-order-position-sync.ts` - Test the API endpoints
- `scripts/verify-order-position-table.ts` - Verify table creation

## Setup Instructions

1. Run the database migration:
   ```bash
   npm run migrate-order-position
   ```

2. Verify the table was created correctly:
   ```bash
   npm run verify-order-position
   ```

3. Start your development server:
   ```bash
   npm run dev
   ```

4. Test the syncing functionality:
   ```bash
   npm run test-order-position
   ```

## How It Works

1. When a user reorders items in the KDS via drag and drop:
   - The new order is immediately reflected in the UI
   - The order is saved to localStorage for persistence
   - The order is synced to the database in real-time

2. When a user loads the KDS:
   - Initial order positions are loaded from the database
   - If database is unavailable, it falls back to localStorage
   - Pinned items always stay at the top regardless of order

3. Data Structure:
   - Table: `order_position`
   - Columns: `id`, `tab_name`, `order_id`, `position`, `created_at`, `updated_at`
   - Unique constraint on `tab_name` + `order_id`

## Troubleshooting

If you encounter issues:

1. Make sure your `.env` file contains a valid `DATABASE_URL`
2. Ensure the development server is running when testing
3. Check that the `order_position` table was created successfully

## Future Improvements

1. Add user-specific ordering (currently global)
2. Implement conflict resolution for concurrent edits
3. Add offline support with sync queue