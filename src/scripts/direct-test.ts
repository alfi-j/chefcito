import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { MongoClient } from 'mongodb';

async function directTest() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('MONGODB_URI not found in environment variables');
    return;
  }
  
  console.log('Attempting to connect with URI:', uri.replace(/\/\/(.*?):(.*?)@/, '//USERNAME:PASSWORD@'));
  
  const client = new MongoClient(uri);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected successfully!');
    
    const db = client.db('chefcito');
    console.log('Database name:', db.databaseName);
    
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    await client.close();
    console.log('Disconnected successfully');
  } catch (error) {
    console.error('Connection failed:', error);
    await client.close();
  }
}

directTest().catch(console.error);