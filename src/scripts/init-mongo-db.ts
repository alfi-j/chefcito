import { dbManager } from '@/lib/mongodb';
import { promises as fs } from 'fs';
import { join } from 'path';
import { 
  findMany as findManyTyped, 
  insertMany as insertManyTyped
} from '@/lib/mongodb';

const readData = async <T>(filename: string): Promise<T[]> => {
  try {
    const filePath = join(process.cwd(), 'data', filename);
    const fileContents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.warn(`Could not read ${filename}:`, error);
    return [];
  }
};

async function initMongoDB() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Loaded' : 'Not found');
    console.log('MONGODB_DB:', process.env.MONGODB_DB || 'Using default');
    
    await dbManager.connect();
    console.log('Connected to MongoDB successfully');

    // Read and insert categories
    const categories = await readData<any[]>('categories.json');
    if (categories.length > 0) {
      await insertManyTyped('categories', categories);
      console.log(`Inserted ${categories.length} categories`);
    }

    // Read and insert menu items
    const menuItems = await readData<any[]>('menuItems.json');
    if (menuItems.length > 0) {
      await insertManyTyped('menuItems', menuItems);
      console.log(`Inserted ${menuItems.length} menu items`);
    }

    // Read and insert inventory items
    const inventory = await readData<any[]>('inventory.json');
    if (inventory.length > 0) {
      await insertManyTyped('inventories', inventory);
      console.log(`Inserted ${inventory.length} inventory items`);
    }

    // Read and insert customers
    const customers = await readData<any[]>('customers.json');
    if (customers.length > 0) {
      await insertManyTyped('customers', customers);
      console.log(`Inserted ${customers.length} customers`);
    }

    // Read and insert payment methods
    const paymentMethods = await readData<any[]>('paymentMethods.json');
    if (paymentMethods.length > 0) {
      await insertManyTyped('paymentMethods', paymentMethods);
      console.log(`Inserted ${paymentMethods.length} payment methods`);
    }
    

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing MongoDB:', error);
  } finally {
    await dbManager.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the initialization if this script is executed directly
if (require.main === module) {
  initMongoDB().catch(console.error);
}

export default initMongoDB;