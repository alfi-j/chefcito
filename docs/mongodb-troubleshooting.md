# MongoDB Troubleshooting Guide

This guide helps resolve common issues with MongoDB connectivity and data operations.

## Common Issues and Solutions

### 1. Connection Issues

**Symptoms**: 
- "Authentication failed" errors
- "Connection timeout" errors
- Application fails to start or fetch data

**Solutions**:
- Verify your MongoDB connection string in `.env.local`
- Check that your IP address is whitelisted in MongoDB Atlas
- Confirm your database user credentials are correct
- Ensure your MongoDB cluster is active and not paused

### 2. Data Not Loading

**Symptoms**:
- Empty lists in the UI
- "No data found" messages
- Application appears to load but shows no content

**Solutions**:
- Run `npm run db:init` to populate the database with sample data
- Check that the database collections exist and contain data
- Verify the database name in your connection string matches your actual database

### 3. Performance Issues

**Symptoms**:
- Slow page loads
- Delayed data updates
- Timeouts when fetching data

**Solutions**:
- Check MongoDB Atlas performance metrics
- Review your database indexes
- Optimize queries in the MongoDB service layer
- Consider upgrading your MongoDB Atlas tier

## Testing Database Connectivity

Use the provided scripts to test and verify your MongoDB setup:

1. Test connection:
   ```bash
   npm run db:test
   ```

2. Initialize database with sample data:
   ```bash
   npm run db:init
   ```

3. Verify data insertion:
   ```bash
   npm run db:verify
   ```

## Debugging Environment Variables

To debug environment variable issues:

1. Run the debug script:
   ```bash
   npm run db:debug
   ```

2. Check that the output shows your MongoDB URI and database name correctly

## Data Service Layer

The application uses a dedicated MongoDB service layer (`src/lib/mongo-data-service.ts`) that handles all data operations. This service:

- Manages MongoDB connections efficiently
- Provides typed methods for all CRUD operations
- Handles errors gracefully
- Ensures proper resource cleanup

If you encounter issues with specific data operations, check the implementation in this service layer.

## Getting Help

If you're still experiencing issues:

1. Check the MongoDB Atlas dashboard for any alerts or issues
2. Review the application logs for detailed error messages
3. Verify your MongoDB Atlas cluster is active and not paused
4. Ensure your database user has the correct permissions
5. Check that your IP address is whitelisted in MongoDB Atlas

For additional help, refer to the MongoDB Atlas documentation or contact MongoDB support.