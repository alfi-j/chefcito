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

---

This project was built using AI assistance.