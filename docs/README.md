# Chefcito Documentation

This folder contains all the documentation for the Chefcito project.

## Documentation Files

- [blueprint.md](blueprint.md) - Project blueprint with core features and style guidelines
- [database-schema.md](database-schema.md) - Database schema diagram in Mermaid format
- [database-schema.sql](database-schema.sql) - SQL schema definition
- [api.md](api.md) - Comprehensive API documentation

## Overview

Chefcito is a restaurant management system with Point of Sale (POS) and Kitchen Display System (KDS) capabilities. The system includes:

1. **Frontend Application** - Built with Next.js, React, and TypeScript
2. **Backend API** - Serverless functions using Next.js API routes
3. **Database** - PostgreSQL database hosted on NeonDB

## Database Structure

The database consists of 8 main tables:
- Categories
- Menu Items
- Orders (with embedded items and status history)
- Customers
- Staff
- Payment Methods
- Inventory Items
- Tasks

Refer to [database-schema.md](database-schema.md) for a visual representation of the relationships between tables.

## API Endpoints

The API provides RESTful endpoints for all database entities. For detailed information about each endpoint, including request/response formats, please refer to the [API Documentation](api.md).

## Project Structure

```
chefcito/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── data/            # JSON data files
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and database connection
│   └── context/         # React context providers
├── docs/                # Project documentation
├── scripts/             # Migration and utility scripts
└── public/              # Static assets
```