import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { dbManager, insertMany } from '../lib/mongodb';
import { readData } from '../lib/data-utils';
import path from 'path';

const dataDir = path.join(process.cwd(), 'src', 'data');

async function initMongoDB() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Loaded' : 'Not found');
    console.log('MONGODB_DB:', process.env.MONGODB_DB || 'Using default');
    
    await dbManager.connect();
    console.log('Connected to MongoDB successfully');

    // Load data from JSON files
    console.log('Loading data from JSON files...');
    const categories = await readData<any[]>('categories.json');
    const menuItems = await readData<any[]>('menu-items.json');
    const paymentMethods = await readData<any[]>('payment-methods.json');
    const customers = await readData<any[]>('customers.json');
    const inventory = await readData<any[]>('inventory.json');
    const staff = await readData<any[]>('staff.json');
    const orders = await readData<any[]>('orders.json');

    // Insert data into MongoDB collections
    console.log('Inserting data into MongoDB collections...');
    
    if (categories.length > 0) {
      await insertMany('categories', categories);
      console.log(`Inserted ${categories.length} categories`);
    }
    
    if (menuItems.length > 0) {
      await insertMany('menuItems', menuItems);
      console.log(`Inserted ${menuItems.length} menu items`);
    }
    
    if (paymentMethods.length > 0) {
      await insertMany('paymentMethods', paymentMethods);
      console.log(`Inserted ${paymentMethods.length} payment methods`);
    }
    
    if (customers.length > 0) {
      await insertMany('customers', customers);
      console.log(`Inserted ${customers.length} customers`);
    }
    
    if (inventory.length > 0) {
      await insertMany('inventory', inventory);
      console.log(`Inserted ${inventory.length} inventory items`);
    }
    
    if (staff.length > 0) {
      await insertMany('staff', staff);
      console.log(`Inserted ${staff.length} staff members`);
    }
    
    if (orders.length > 0) {
      await insertMany('orders', orders);
      console.log(`Inserted ${orders.length} orders`);
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