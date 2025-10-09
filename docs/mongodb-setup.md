# MongoDB Setup Guide

This guide explains how to set up MongoDB for the Chefcito application.

## Prerequisites

- MongoDB Atlas account (or local MongoDB installation)
- Node.js and npm installed

## Setup Instructions

1. Create a MongoDB Atlas cluster:
   - Sign up for MongoDB Atlas at https://www.mongodb.com/cloud/atlas
   - Create a new cluster
   - Configure network access to allow connections from your application
   - Create a database user with read/write permissions

2. Configure environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Update the `MONGODB_URI` with your MongoDB connection string
   - Set the `MONGODB_DB` to your database name

3. Initialize the database:
   ```bash
   npm run db:init
   ```

4. Test the connection:
   ```bash
   npm run db:test
   ```

## Database Schema

The application uses the following collections:

- `categories`: Menu categories
- `menuItems`: Menu items
- `orders`: Customer orders
- `paymentMethods`: Payment methods
- `customers`: Customer information
- `inventory`: Inventory items
- `staff`: Staff members
- `tasks`: Tasks for waiters

Each collection contains documents with fields that match the TypeScript types defined in the application.

## Data Operations

All data operations are handled through the MongoDB service layer (`src/lib/mongo-data-service.ts`). This service provides:

- Connection management with proper error handling
- CRUD operations for all data entities
- Data validation and transformation
- Resource cleanup and connection pooling

## Troubleshooting

- **Connection Issues**: Ensure your MongoDB URI is correct and that your network settings allow connections.
- **Data Initialization**: Verify that the JSON files in `src/data/` are correctly formatted and contain valid data.
- **Environment Variables**: Double-check that your `.env.local` file is correctly configured with the necessary variables.
