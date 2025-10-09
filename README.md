# Chefcito - Restaurant Management System

Chefcito is a comprehensive restaurant management system designed to streamline operations from order taking to kitchen display and reporting. Built with Next.js 15, it features a modern UI with real-time updates and multi-language support.

## Features

- **Point of Sale (POS)**: Intuitive order taking interface with menu browsing and payment processing
- **Kitchen Display System (KDS)**: Real-time order tracking and kitchen workflow management
- **Inventory Management**: Stock level monitoring and automated low-stock alerts
- **Reporting Dashboard**: Sales analytics and performance metrics
- **User Management**: Role-based access control with Admin, Restaurant Owner, and Staff roles
- **Multi-language Support**: Available in English and Spanish with easy extensibility

## Technology Stack

- **Frontend**: Next.js 15 with React Server Components and App Router
- **Backend**: MongoDB Atlas for data persistence
- **UI Components**: Tailwind CSS, Radix UI, and custom components
- **State Management**: React Context API
- **Internationalization**: Custom i18n solution
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
- PaymentMethods: Available payment options

All data operations are handled through a dedicated MongoDB service layer that provides typed methods for all backend operations.

## Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── (app)/          # Main application pages
│   ├── api/            # API routes
│   └── login/          # Login page
├── components/          # Reusable UI components
├── context/             # React context providers
├── hooks/               # Custom React hooks
├── lib/                 # Library and utility functions
├── models/              # MongoDB data models
└── scripts/             # Utility scripts

docs/                    # Documentation
```

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

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Access the application**:
   Open your browser to `http://localhost:9002`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run db:schema` - Initialize database schema with collections and indexes
- `npm run db:init` - Initialize MongoDB with sample data
- `npm run db:check` - Check current database collections and status

## Documentation

Essential documentation is located in the [docs/](docs/) directory:
- [Setup Instructions](docs/SETUP_INSTRUCTIONS.md) - Complete setup guide
- [MongoDB Setup](docs/mongodb-setup.md) - Database configuration
- [Troubleshooting](docs/mongodb-troubleshooting.md) - Common issues and solutions

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.