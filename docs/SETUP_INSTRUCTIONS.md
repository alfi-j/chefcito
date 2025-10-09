# MongoDB Atlas Setup Instructions

## Current Issue
The application is still trying to connect with the placeholder `<db_password>` instead of your actual password.

## Solution Steps

1. **Verify your .env.local file**
   Make sure your `.env.local` file contains your actual password, not the placeholder:
   ```
   MONGODB_URI=mongodb+srv://ajestrellar:YOUR_REAL_PASSWORD@chefcito-cluster.wxbzjce.mongodb.net/chefcito?retryWrites=true&w=majority&appName=chefcito-cluster
   MONGODB_DB=chefcito
   ```

2. **Replace the placeholder**
   You need to replace `YOUR_REAL_PASSWORD` with your actual MongoDB Atlas password.

3. **If you're unsure of your password**
   - Go to MongoDB Atlas
   - Navigate to "Database Access" in the left sidebar
   - Find your user (ajestrellar)
   - Either remember your password or reset it

4. **Test with environment variables directly**
   Instead of relying on the .env.local file, you can test with:
   ```bash
   MONGODB_URI="mongodb+srv://ajestrellar:YOUR_REAL_PASSWORD@chefcito-cluster.wxbzjce.mongodb.net/chefcito?retryWrites=true&w=majority&appName=chefcito-cluster" npm run db:test
   ```

5. **Check for special characters in your password**
   If your password contains special characters like `@`, `:`, `/`, `?`, `#`, `[`, `]`, you need to URL encode them:
   - `@` becomes `%40`
   - `:` becomes `%3A`
   - `/` becomes `%2F`
   - `?` becomes `%3F`
   - `#` becomes `%23`
   - `[` becomes `%5B`
   - `]` becomes `%5D`

6. **Verify your IP whitelist**
   Make sure your current IP address is whitelisted in MongoDB Atlas:
   - Go to MongoDB Atlas
   - Navigate to "Network Access" in the left sidebar
   - Make sure your current IP is listed or add "Allow access from anywhere" (0.0.0.0/0) for testing

After completing these steps, try running the test again:
```bash
npm run db:test
```