# Chefcito

Chefcito is a modern restaurant management system featuring a Point of Sale (POS) and Kitchen Display System (KDS). Built with Next.js and MongoDB, it provides a complete solution for managing orders, kitchen workflows, and restaurant operations.

## Features

- Point of Sale (POS) system
- Kitchen Display System (KDS) with real-time updates
- Multi-workstation kitchen workflow management
- Order management
- Menu management
- Staff management
- Reporting and analytics
- Real-time updates with Server-Sent Events (SSE)

## Getting Started

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd chefcito
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   - Copy `.env.local.example` to `.env.local`
   - Update the MongoDB connection string and database name

4. **Initialize the database**:
   ```bash
   npm run db:schema
   ```

5. **Set up default workstations**:
   ```bash
   npm run db:setup-default-workstations
   ```

6. **Start the development server**:
   ```bash
   npm run dev
   ```

7. **Access the application**:
   Open your browser to `http://localhost:9002`

## System Architecture

Chefcito consists of two main components:

### Point of Sale (POS)
- Located at `/pos`
- Used for taking orders, managing tables, and processing payments
- Features a touch-friendly interface with categorized menu items
- Supports dine-in, takeout, and delivery orders
- Real-time communication with the kitchen through the KDS

### Kitchen Display System (KDS)
- Located at `/kds`
- Displays incoming orders for kitchen staff
- Supports multiple workstations (e.g., "Kitchen", "Grill", "Fryer")
- Drag-and-drop functionality for reordering
- Item status tracking (New, In Progress, Ready)
- Real-time updates via Server-Sent Events (SSE)
- Workstation-specific workflows with proper item transitions
- Custom workstation support with rollback functionality

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run db:schema` - Initialize database schema with collections and indexes
- `npm run db:init` - Initialize MongoDB with sample data
- `npm run db:check` - Check current database collections and status
- `npm run db:setup-default-workstations` - Set up default "Kitchen" and "Ready" workstations
- `npm run db:ensure-default-workstations` - Ensure default workstations exist in the database
- `npm run db:rename-cocina-to-kitchen` - Rename "Cocina" workstations to "Kitchen"
- `npm run db:reset-orders` - Reset orders in the database
- `npm run dev:debug` - Start development server with debug logging enabled

## Technical Highlights

### Real-time Updates
- Implemented with Server-Sent Events (SSE) for efficient, real-time communication
- Orders instantly appear in the KDS when placed through the POS
- Status changes propagate immediately across all connected clients

### Workstation Management
- Configurable workstations for different kitchen areas
- Items progress through workstations as they're prepared
- Visual indicators for item statuses (New, In Progress, Ready)
- Drag-and-drop reordering capability

### Data Architecture
- MongoDB database with Mongoose schemas
- Well-defined data models for Orders, Menu Items, Workstations, and more
- Efficient indexing for optimal query performance

### State Management
- Client-side state managed with Zustand
- Stores for current order, menu items, workstations, and UI state
- Optimistic UI updates for responsive interactions

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.