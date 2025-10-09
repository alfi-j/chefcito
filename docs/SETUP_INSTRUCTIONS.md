# Setup Instructions

## Prerequisites

- Node.js (version 18 or higher)
- MongoDB Atlas account or local MongoDB installation
- Git

## Setup Steps

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

## Default User Credentials

After running the database initialization, you'll have a default admin user:
- Email: admin@chefcito.com
- Password: admin123

You can change these credentials after logging in.

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

For additional help, refer to the [MongoDB Setup Guide](mongodb-setup.md) or [Troubleshooting Guide](mongodb-troubleshooting.md).