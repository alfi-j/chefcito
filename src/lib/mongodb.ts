import { MongoClient, Db, Document } from 'mongodb';
import { parse } from 'url';

// Load environment variables
if (typeof process.env.NODE_ENV === 'undefined' || process.env.NODE_ENV !== 'production') {
  const path = require('path');
  const dotenv = require('dotenv');
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'chefcito';

// Parse database name from URI if not explicitly provided
let dbName = MONGODB_DB;
if (MONGODB_URI && !process.env.MONGODB_DB && MONGODB_URI.startsWith('mongodb+srv://')) {
  try {
    const parsed = parse(MONGODB_URI, true);
    if (parsed.pathname && parsed.pathname.length > 1) {
      dbName = parsed.pathname.substring(1); // Remove leading slash
    }
  } catch (e) {
    console.warn('Could not parse database name from MONGODB_URI, using default:', dbName);
  }
} else if (MONGODB_URI && !process.env.MONGODB_DB && MONGODB_URI.startsWith('mongodb://')) {
  try {
    const parsed = parse(MONGODB_URI, true);
    if (parsed.pathname && parsed.pathname.length > 1) {
      dbName = parsed.pathname.substring(1);
    }
  } catch (e) {
    console.warn('Could not parse database name from MONGODB_URI, using default:', dbName);
  }
}


// Global variables to maintain connection across hot reloads in development
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

class DatabaseManager {
  private client: MongoClient | null = null;
  private clientPromise: Promise<MongoClient> | null = null;

  connect = async (): Promise<MongoClient> => {
    if (this.clientPromise) {
      return this.clientPromise;
    }

    console.log('Creating new MongoDB client with URI:', MONGODB_URI);
    
    // In development, store the promise in a global variable to avoid multiple connections
    if (process.env.NODE_ENV === 'development') {
      if (!global._mongoClientPromise) {
        this.client = new MongoClient(MONGODB_URI);
        global._mongoClientPromise = this.client.connect();
      }
      this.clientPromise = global._mongoClientPromise;
    } else {
      // In production, create a new connection
      this.client = new MongoClient(MONGODB_URI);
      this.clientPromise = this.client.connect();
    }

    return this.clientPromise;
  };

  getDb = async (): Promise<Db> => {
    const client = await this.connect();
    return client.db(dbName);
  };

  getCollection = async (collectionName: string) => {
    const db = await this.getDb();
    return db.collection(collectionName);
  };

  close = async () => {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.clientPromise = null;
      if (process.env.NODE_ENV === 'development') {
        global._mongoClientPromise = undefined;
      }
    }
  };
}

// Export a singleton instance
export const dbManager = new DatabaseManager();

// Helper functions for common operations
export const findOne = async <T>(collectionName: string, filter: any = {}): Promise<T | null> => {
  const collection = await dbManager.getCollection(collectionName);
  return (await collection.findOne(filter)) as T | null;
};

export const findMany = async <T>(collectionName: string, filter: any = {}): Promise<T[]> => {
  const collection = await dbManager.getCollection(collectionName);
  return (await collection.find(filter).toArray()) as T[];
};

export const insertOne = async <T extends Document>(collectionName: string, document: T): Promise<any> => {
  const collection = await dbManager.getCollection(collectionName);
  return await collection.insertOne(document);
};

export const insertMany = async <T extends Document>(collectionName: string, documents: T[]): Promise<any> => {
  const collection = await dbManager.getCollection(collectionName);
  return await collection.insertMany(documents);
};

export const updateOne = async <T>(
  collectionName: string,
  filter: any,
  update: any
): Promise<any> => {
  const collection = await dbManager.getCollection(collectionName);
  return await collection.updateOne(filter, update);
};

export const updateMany = async <T>(
  collectionName: string,
  filter: any,
  update: any
): Promise<any> => {
  const collection = await dbManager.getCollection(collectionName);
  return await collection.updateMany(filter, update);
};

export const deleteOne = async (collectionName: string, filter: any): Promise<any> => {
  const collection = await dbManager.getCollection(collectionName);
  return await collection.deleteOne(filter);
};

export const deleteMany = async (collectionName: string, filter: any): Promise<any> => {
  const collection = await dbManager.getCollection(collectionName);
  return await collection.deleteMany(filter);
};