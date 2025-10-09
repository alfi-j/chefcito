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
   - Set the `MONGODB_DB` to your database name (default is "chefcito")

3. Initialize the database schema:
   ```bash
   npm run db:schema
   ```

4. Initialize the database with sample data (optional):
   ```bash
   npm run db:init
   ```

5. Test the connection:
   ```bash
   npm run db:test
   ```

## Database Schema

The application uses the following collections:

- `users`: User accounts with authentication and role-based access
- `staff`: Staff member information
- `categories`: Menu categories and modifier groups
- `menuItems`: Menu items with pricing and availability
- `orders`: Customer orders with status tracking
- `inventory`: Stock items with low-stock alerts
- `customers`: Customer information
- `paymentMethods`: Available payment options

Each collection is created with appropriate indexes for optimal performance.

## Available Scripts

- `npm run db:schema`: Creates all required collections and indexes
- `npm run db:init`: Populates the database with sample data
- `npm run db:test`: Tests the MongoDB connection

## Data Operations

All data operations are handled through the MongoDB service layer (`src/lib/mongo-data-service.ts`). This service provides:

- Connection management with proper error handling
- CRUD operations for all data entities
- Data validation and transformation
- Resource cleanup and connection pooling

For troubleshooting common issues, refer to the [Troubleshooting Guide](mongodb-troubleshooting.md).