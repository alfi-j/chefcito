# MongoDB Atlas Connection Troubleshooting

## Common Authentication Issues and Solutions

### 1. Incorrect Username or Password

**Symptoms**: `MongoServerError: bad auth : authentication failed`

**Solutions**:
- Double-check your username and password
- Try creating a new database user with a simple password (no special characters)
- Reset your password in MongoDB Atlas:
  1. Go to MongoDB Atlas Dashboard
  2. Navigate to "Database Access"
  3. Find your user and click "Edit"
  4. Change the password and save

### 2. Special Characters in Password

**Symptoms**: Authentication fails even with correct credentials

**Solutions**:
- If your password contains special characters, URL encode them:
  - `@` becomes `%40`
  - `:` becomes `%3A`
  - `/` becomes `%2F`
  - `?` becomes `%3F`
  - `#` becomes `%23`
  - `[` becomes `%5B`
  - `]` becomes `%5D`

### 3. IP Whitelist Issues

**Symptoms**: Connection timeouts or "IP not whitelisted" errors

**Solutions**:
- Go to MongoDB Atlas Dashboard
- Navigate to "Network Access"
- Add your current IP address or use "Allow access from anywhere" (0.0.0.0/0) for testing

### 4. Wrong Database User Permissions

**Symptoms**: Connection succeeds but operations fail

**Solutions**:
- Go to MongoDB Atlas Dashboard
- Navigate to "Database Access"
- Edit your user and ensure it has appropriate permissions:
  - "Atlas Admin" (full access)
  - "Read/Write Any Database" (for application use)

## Testing Steps

1. **Verify your connection string**:
   ```
   mongodb+srv://USERNAME:PASSWORD@CLUSTER_HOST/DATABASE?retryWrites=true&w=majority
   ```

2. **Test with a simple connection tool**:
   - Use MongoDB Compass (GUI tool)
   - Use mongo shell command line tool

3. **Test with a minimal Node.js script**:
   ```javascript
   const { MongoClient } = require('mongodb');
   
   const uri = "your_connection_string_here";
   const client = new MongoClient(uri);
   
   async function test() {
     try {
       await client.connect();
       console.log("Connected successfully");
       await client.close();
     } catch (error) {
       console.error("Connection failed:", error);
     }
   }
   
   test();
   ```

## Creating a New Database User (Recommended)

1. Go to MongoDB Atlas Dashboard
2. Navigate to "Database Access" in the left sidebar
3. Click "Add New Database User"
4. Fill in the details:
   - Username: `chefcito_user`
   - Password: `chefcito123` (or generate a secure password)
   - Database User Privileges: Select "Atlas Admin"
5. Click "Add User"

6. Update your `.env.local` file:
   ```
   MONGODB_URI=mongodb+srv://chefcito_user:chefcito123@chefcito-cluster.wxbzjce.mongodb.net/chefcito?retryWrites=true&w=majority&appName=chefcito-cluster
   MONGODB_DB=chefcito
   ```

## Whitelisting Your IP Address

1. Go to MongoDB Atlas Dashboard
2. Navigate to "Network Access" in the left sidebar
3. Click "Add IP Address"
4. Options:
   - "Add Current IP Address" (recommended for development)
   - "Allow Access From Anywhere" (0.0.0.0/0) - only for testing
5. Click "Confirm"

After making these changes, try running:
```bash
npm run db:test
```