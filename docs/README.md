# Chefcito Documentation

This directory contains all documentation for the Chefcito project, organized into three main documents:

1. [Frontend Documentation](frontend.md) - Covers the frontend architecture, components, and implementation details
2. [Backend Documentation](backend.md) - Covers the backend architecture, API routes, data models, and implementation details
3. [Application Overview](app.md) - Provides a comprehensive overview of the entire application

## Quick Links

- [Setup Instructions](SETUP_INSTRUCTIONS.md) - General setup instructions
- [MongoDB Setup Guide](mongodb-setup.md) - Instructions for setting up MongoDB
- [MongoDB Troubleshooting](mongodb-troubleshooting.md) - Troubleshooting common MongoDB issues

## Project Overview

Chefcito is a comprehensive restaurant management system designed to streamline operations from order taking to kitchen display and reporting. Built with Next.js 15, it features a modern UI with real-time updates and multi-language support.

### Features

- **Point of Sale (POS)**: Intuitive order taking interface with menu browsing and payment processing
- **Kitchen Display System (KDS)**: Real-time order tracking and kitchen workflow management
- **Inventory Management**: Stock level monitoring and automated low-stock alerts
- **Reporting Dashboard**: Sales analytics and performance metrics
- **User Management**: Role-based access control with Admin, Restaurant Owner, and Staff roles
- **Multi-language Support**: Available in English and Spanish with easy extensibility

### Technology Stack

- **Frontend**: Next.js 15 with React Server Components and App Router
- **Backend**: MongoDB Atlas for data persistence
- **UI Components**: Tailwind CSS, Radix UI, and custom components
- **State Management**: Zustand for client-side state management
- **Data Fetching**: SWR (Stale-While-Revalidate) for efficient data fetching
- **Internationalization**: Custom i18n solution with Zustand store
- **Real-time Updates**: Server-Sent Events (SSE) for live data synchronization
- **Deployment**: Docker-ready with docker-compose configuration

## Documentation Structure

### Frontend Documentation

Covers all frontend aspects of the application:
- UI components and architecture
- Data fetching patterns
- State management
- Internationalization
- Real-time updates
- Authentication flows
- Refactored patterns and best practices

File: [frontend.md](frontend.md)

### Backend Documentation

Covers all backend aspects of the application:
- Data architecture and models
- API routes and endpoints
- Database connection management
- Data service layer
- Authentication system
- Validation approaches
- Error handling
- Available scripts

File: [backend.md](backend.md)

### Application Overview

Provides a comprehensive overview of the entire application:
- Overall architecture
- Data flow between components
- System requirements
- Deployment instructions
- Configuration options
- Troubleshooting guide

File: [app.md](app.md)

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
- `npm run db:test` - Tests the MongoDB connection
- `npm run db:update-workstations` - Updates the MongoDB Atlas schema to include the workstations collection
- `npm run check-duplicate-collections` - Checks for duplicate collections in the database
- `npm run fix-duplicate-collections` - Fixes duplicate collections in the database

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.