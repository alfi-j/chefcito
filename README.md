<<<<<<< HEAD
# Chefcito - Restaurant Management System

Chefcito is a comprehensive restaurant management system built with Next.js that includes POS (Point of Sale), KDS (Kitchen Display System), and reporting capabilities.

## Features

- **POS (Point of Sale)**: Intuitive interface for taking orders
- **KDS (Kitchen Display System)**: Real-time order display for kitchen staff
- **Restaurant Management**: Menu, inventory, and staff management
- **Reporting**: Sales and performance analytics
- **Waiter Task Management**: Task assignment and tracking

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **UI**: Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (NeonDB)
- **Deployment**: Vercel

## Deployment

This application is configured for deployment on Vercel with a Neon PostgreSQL database.

### Environment Variables

The application requires the following environment variables:

- `DATABASE_URL`: PostgreSQL connection string for NeonDB

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add the `DATABASE_URL` environment variable in Vercel project settings
3. Deploy the application

The application uses Next.js API Routes for backend functionality, which are automatically handled by Vercel's Next.js runtime.

## Database

The application uses PostgreSQL with the following tables:
- Categories
- Menu Items
- Orders
- Order Items
- Payment Methods
- Customers
- Inventory
- Staff
- Tasks

Tables are automatically created on first run if they don't exist.

## Development

To run the application locally:

```bash
npm install
npm run dev
```

To build for production:

```bash
npm run build
```

## Project Structure

- `src/app/(app)/` - Main application pages
- `src/app/api/` - API routes
- `src/components/` - Reusable UI components
- `src/lib/` - Utility functions and database connection
- `src/hooks/` - Custom React hooks

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [NeonDB Documentation](https://neon.tech/docs)
- [Vercel Documentation](https://vercel.com/docs)
=======
# Chefcito

Kitchen Display System + POS web app built on Next.js

## Overview

Chefcito is a comprehensive restaurant management system that includes both a Point of Sale (POS) system and a Kitchen Display System (KDS). This application helps restaurants streamline their order management process from order creation to fulfillment.

## Features

- **POS System**: Intuitive interface for creating and managing customer orders
- **KDS**: Real-time kitchen display for tracking order status
- **Menu Management**: Easy management of menu items and categories
- **Order Tracking**: Real-time status updates from order placement to completion
- **Staff Management**: Role-based access control for different staff members
- **Reporting**: Sales and performance reports

## Tech Stack

- [Next.js 14](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Neon PostgreSQL](https://neon.tech/)
- [NextAuth.js](https://next-auth.js.org/)

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
```

2. Install dependencies:
```bash
npm install
# or
yarn
# or
pnpm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory and add your database connection string:
```env
DATABASE_URL=your_neon_postgresql_connection_string
```

4. Run database migrations:
```bash
npm run migrate
# or
pnpm migrate
```

5. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

The application can be deployed to Vercel with minimal configuration. Make sure to set the environment variables in your Vercel project settings.

## Project Structure

```
src/
├── app/              # Next.js app router pages
│   ├── (app)/        # Main application pages
│   ├── api/          # API routes
│   └── login/        # Login page
├── components/       # React components
├── context/          # React context providers
├── hooks/            # Custom React hooks
├── lib/              # Utility functions and types
├── locales/          # Translation files
└── styles/           # Global styles
docs/                 # Documentation
scripts/              # Migration scripts
```

## Backend Implementation

Chefcito uses a serverless PostgreSQL database (Neon) with Next.js API routes for the backend. The frontend communicates with the backend through a dedicated API client that handles all HTTP requests to the API routes.

### API Client

The application uses an API client (`src/lib/api-client.ts`) that provides typed methods for all backend operations. This client handles:
- Making HTTP requests to the Next.js API routes
- Error handling and response parsing
- Type safety for all API operations

### API Routes

All backend functionality is exposed through Next.js API routes located in `src/app/api/`. These routes:
- Connect to the PostgreSQL database using a connection pool
- Handle CRUD operations for all entities (categories, menu items, orders, etc.)
- Return properly formatted JSON responses
- Implement proper error handling

### Data Context

The application uses React Context (`src/context/data-context.tsx`) to manage global state. The context:
- Fetches data from the backend API on initial load
- Provides data to all components in the application
- Handles loading states and error conditions

## Package Management

To keep the project up-to-date with the latest package versions, you can run:

```bash
npx tsx scripts/update-packages.ts
```

This script will update all dependencies to their latest versions.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
>>>>>>> d3399ff (Chefcito Beta!)
