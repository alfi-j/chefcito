# Chefcito

Restaurant management system with Point of Sale (POS) and Kitchen Display System (KDS). Built with Next.js, MongoDB, and TypeScript.

## Core Features

- Real-time order management with Server-Sent Events (SSE)
- Multi-workstation kitchen workflow with item status tracking (New, In Progress, Ready)
- Role-based access control (Owner, Admin, Staff)
- Inventory management
- Reporting and analytics
- Multi-language support (English/Spanish)
- Touch-friendly responsive UI

## Technical Architecture

### Main Components

#### Point of Sale (POS) - `/pos`
- Order creation and customization
- Payment processing
- Menu browsing with category filtering
- Workstation assignment for items

#### Kitchen Display System (KDS) - `/kds`
- Real-time order visualization
- Drag-and-drop order prioritization
- Multi-workstation workflow management
- Item status progression through workstations
- SSE for live updates

#### Data Layer
- MongoDB with Mongoose schemas
- Normalized data models for Orders, Menu Items, Workstations
- Indexed queries for performance optimization
- Docker integration for development environment

#### State Management
- Zustand stores for client-side state
- Separate stores for orders, menu, workstations, reports
- Optimistic UI updates
- SWR for data fetching and caching

## Getting Started

1. **Clone and install**:
   ```bash
   git clone <repository-url>
   cd chefcito
   npm install
   ```

2. **Environment setup**:
   - Copy `.env.local.example` to `.env.local`
   - Configure MongoDB connection string

3. **Database initialization**:
   ```bash
   npm run db:schema
   npm run db:setup-default-workstations
   ```

4. **Development server**:
   ```bash
   npm run dev
   ```
   Access at `http://localhost:9002`

## Workstation Workflow

Items progress through workstations in a predefined sequence:
1. **New**: Item arrives at workstation
2. **In Progress**: Preparation started
3. **Ready**: Preparation completed

The final workstation serves as the "Ready" station for serving staff.

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run lint` - Code linting
- `npm run db:schema` - Initialize database schema
- `npm run db:init` - Load sample data
- `npm run db:setup-default-workstations` - Create Kitchen/Ready workstations
- `npm run dev:debug` - Debug mode with logging

## Key Technical Implementations

### Real-time Communication
- SSE endpoints at `/api/orders/events`
- Automatic revalidation with SWR
- Instant order propagation from POS to KDS

### Workstation System
- Configurable workstation entities with position ordering
- Item transitions between workstations
- Status persistence per workstation
- Rollback functionality for error correction

### Data Models
- Order schema with embedded items
- Workstation schema with position tracking
- Menu item normalization with category relationships
- Indexed queries for performance

## License

MIT License - see [LICENSE](LICENSE) file.