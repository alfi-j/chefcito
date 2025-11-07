# Chefcito Application Overview

## Project Description

Chefcito is a comprehensive restaurant management system designed to streamline operations from order taking to kitchen display and reporting. Built with Next.js 15, it features a modern UI with real-time updates and multi-language support.

## Technology Stack

- **Full Stack Framework**: Next.js 15 with React Server Components and App Router
- **Database**: MongoDB Atlas for data persistence
- **UI Components**: Tailwind CSS, Radix UI, and custom components
- **State Management**: Zustand for client-side state management
- **Data Fetching**: SWR (Stale-While-Revalidate) for efficient data fetching
- **Internationalization**: Custom i18n solution with Zustand store
- **Real-time Updates**: Server-Sent Events (SSE) for live data synchronization
- **Deployment**: Docker-ready with docker-compose configuration

## Data Architecture

The application uses MongoDB Atlas as its primary data store with the following collections:
- Users: User accounts with role-based access control
- Staff: Staff member information
- Categories: Menu categories and modifier groups
- MenuItems: Food and drink items with pricing
- Orders: Customer orders with status tracking
- Inventory: Stock items with low-stock alerts
- Customers: Customer information
- Payments: Available payment options
- Workstations: Restaurant workstations configuration
- Restaurants: Restaurant information and settings

All data operations are handled through a dedicated MongoDB service layer that provides typed methods for all backend operations.

## Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── (app)/          # Main application pages
│   │   ├── kds/         # Kitchen Display System
│   │   ├── orders/      # Order management
│   │   ├── pos/         # Point of Sale system
│   │   ├── profile/     # User profile management
│   │   ├── reports/     # Reporting dashboard
│   │   └── restaurant/  # Restaurant settings
│   ├── api/             # API routes
│   └── login/           # Login page
├── components/          # Reusable UI components
├── lib/                 # Library and utility functions
│   ├── stores/          # Zustand stores for state management
│   └── ...              # Other utility functions
├── models/              # MongoDB data models
└── scripts/             # Utility scripts

specs/                   # Structured documentation
```

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- MongoDB Atlas account or local MongoDB installation
- Git

### Setup Steps

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
   - Copy `.env.local.example` to `.env.local`:
     ```bash
     cp .env.local.example .env.local
     ```
   - Update the `MONGODB_URI` with your actual MongoDB connection string
   - Set the `MONGODB_DB` to your database name (default is "chefcito")

4. **Initialize the database schema**:
   ```bash
   npm run db:schema
   ```

5. **Initialize the database with sample data** (optional):
   ```bash
   npm run db:init
   ```

6. **Start the development server**:
   ```bash
   npm run dev
   ```

7. **Access the application**:
   Open your browser to `http://localhost:9002`

### Default User Credentials

After running the database initialization, you'll have a default admin user:
- Email: admin@chefcito.com
- Password: admin123

You can change these credentials after logging in.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run db:schema` - Initialize database schema with collections and indexes
- `npm run db:init` - Initialize MongoDB with sample data
- `npm run db:check` - Check current database collections and status

## Common Issues

### MongoDB Connection Issues

1. **Authentication failed**: Verify your MongoDB URI and password are correct
2. **Connection timeout**: Check that your IP is whitelisted in MongoDB Atlas
3. **Network issues**: Ensure your firewall isn't blocking the connection

### Environment Variables

If you're having issues with environment variables:
1. Make sure `.env.local` exists in the root directory
2. Verify there are no extra spaces or characters in the URI
3. If your password contains special characters, URL encode them:
   - `@` becomes `%40`
   - `:` becomes `%3A`
   - `/` becomes `%2F`

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.