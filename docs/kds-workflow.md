# KDS (Kitchen Display System) Workflow

## Overview

The Kitchen Display System (KDS) is a core component of the ChefCito application that manages order processing in restaurant environments. It provides a digital interface for kitchen staff to view, track, and update the status of customer orders in real-time.

## Key Components

### Main KDS Page (`/kds/page.tsx`)
- Central hub for managing all kitchen orders
- Uses React with TypeScript and SWR for data fetching
- Implements drag-and-drop functionality for order reordering
- Supports workstations (kitchen areas) with tabbed interface
- Displays orders in a responsive grid layout

### Order Card Component (`/kds/components/order-card.tsx`)
- Visual representation of individual orders
- Groups order items by category
- Displays order metadata (ID, table number, time elapsed)
- Shows order notes and special instructions
- Implements pinning functionality for priority orders
- Visual urgency indicators for delayed orders

### Order Item Component (`/kds/components/order-item.tsx`)
- Displays individual menu items within an order
- Shows item details (quantity, name, extras, notes)
- Implements status tracking and progression
- Provides visual status indicators with color coding

## Workflow States

The KDS workflow follows these predefined states:

1. **New** - Order item has been placed but not yet started
2. **In Progress** - Kitchen staff has started preparing the item
3. **Ready** - Item is prepared and ready for serving
4. **Served** - Item has been delivered to the customer

## Workstation Management

The KDS supports multiple workstations (kitchen areas) which can be configured via the API:
- Each workstation can have custom status mappings
- Orders are displayed in workstation-specific tabs
- Default workstation is used when none are configured

## Key Features

### Order Management
- Real-time order updates using SWR data fetching
- Drag-and-drop reordering of orders
- Order pinning for priority items
- Visual urgency indicators for delayed orders
- Filtering of orders based on status

### Status Progression
- Click-based status updates (New → In Progress → Ready → Served)
- Ability to revert status changes
- Customizable status mappings per workstation

### User Interface
- Responsive grid layout that adapts to screen size
- Color-coded status indicators
- Time elapsed display with visual urgency cues
- Tabbed interface for workstation management
- Special notes and instruction display

## Technical Implementation

### Data Flow
1. Fetch orders from `/api/orders` endpoint using SWR
2. Fetch workstations from `/api/workstations` endpoint
3. Filter and organize orders by workstation
4. Display orders in appropriate tabs
5. Update order statuses via API calls to `/api/orders`

### State Management
- Client-side state for UI interactions (active tab, drag state)
- Server-side state for order data using MongoDB
- SWR for data caching and real-time updates

### Constants
- `KDS_STATES` object defines the standard workflow states
- Customizable per workstation through API configuration

## API Integration

The KDS integrates with several API endpoints:
- `/api/orders` - Fetch and update order information
- `/api/orders/[id]/pin` - Toggle order pinning
- `/api/workstations` - Fetch workstation configuration

## User Experience

### Visual Design
- Clean card-based interface for order display
- Color-coded status badges for quick recognition
- Responsive layout for various screen sizes
- Animated indicators for urgent orders
- Intuitive drag-and-drop interface

### Interactions
- Single click to advance order item status
- Hover actions for additional controls
- Drag-and-drop for order reordering
- Pinning for order prioritization

## Error Handling

- SWR built-in retry mechanisms for data fetching
- Error logging for failed API requests
- Graceful degradation when API is unavailable
- Loading states during data fetching