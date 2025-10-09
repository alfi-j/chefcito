const { MongoClient } = require('mongodb');

// Replace with your actual connection string
const uri = "mongodb+srv://ajestrellar:lhAVS5FZXpEpKZGY@chefcito-cluster.wxbzjce.mongodb.net/chefcito?retryWrites=true&w=majority&appName=chefcito-cluster";

const client = new MongoClient(uri);

async function testConnection() {
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected successfully to MongoDB');
    
    const db = client.db('chefcito');
    console.log('Database name:', db.databaseName);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    await client.close();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection();