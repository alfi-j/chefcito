const { MongoClient } = require('mongodb');

// Using the provided credentials
const uri = "mongodb+srv://ajestrellar:lhAVS5FZXpEpKZGY@chefcito-cluster.wxbzjce.mongodb.net/chefcito?retryWrites=true&w=majority&appName=chefcito-cluster";

console.log("Attempting to connect to MongoDB with provided credentials...");
console.log("URI:", uri.replace(/\/\/(.*?):(.*?)@/, '//USERNAME:PASSWORD@'));

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testConnection() {
  try {
    console.log("Connecting to MongoDB...");
    await client.connect();
    console.log("✅ Connected successfully to MongoDB");
    
    const db = client.db('chefcito');
    console.log("Database name:", db.databaseName);
    
    // Try to list collections
    console.log("Listing collections...");
    const collections = await db.listCollections().toArray();
    console.log("Available collections:", collections.map(c => c.name));
    
    // Try to create a test collection and insert a document
    console.log("Testing write operation...");
    const testCollection = db.collection('test');
    const result = await testCollection.insertOne({ test: true, timestamp: new Date() });
    console.log("✅ Write operation successful, inserted document with id:", result.insertedId);
    
    // Clean up - delete the test document
    await testCollection.deleteOne({ _id: result.insertedId });
    console.log("✅ Cleaned up test document");
    
    await client.close();
    console.log("✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    if (error.code) {
      console.error("Error code:", error.code);
    }
    if (error.codeName) {
      console.error("Error code name:", error.codeName);
    }
    
    // Try to close the client even if there was an error
    try {
      await client.close();
    } catch (closeError) {
      console.error("Error closing client:", closeError);
    }
  }
}

testConnection();