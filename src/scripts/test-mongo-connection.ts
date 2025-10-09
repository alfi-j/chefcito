import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { dbManager } from '../lib/mongodb';

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Loaded' : 'Not found');
    console.log('MONGODB_DB:', process.env.MONGODB_DB || 'Using default');
    
    const client = await dbManager.connect();
    console.log('Connected successfully to MongoDB');
    
    // Test a simple operation
    const db = await dbManager.getDb();
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    await dbManager.close();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

if (require.main === module) {
  testConnection().catch(console.error);
}

export default testConnection;