#!/usr/bin/env tsx
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { dbManager, findMany } from '../lib/mongodb';

async function verifyData() {
  try {
    console.log('Connecting to MongoDB...');
    await dbManager.connect();
    console.log('Connected to MongoDB successfully\n');

    // Count documents in each collection
    console.log('Data verification:');
    const categories = await findMany('categories');
    console.log(`Categories: ${categories.length} documents`);
    
    const menuItems = await findMany('menuItems');
    console.log(`Menu Items: ${menuItems.length} documents`);
    
    const paymentMethods = await findMany('paymentMethods');
    console.log(`Payment Methods: ${paymentMethods.length} documents`);
    
    const customers = await findMany('customers');
    console.log(`Customers: ${customers.length} documents`);
    
    const inventory = await findMany('inventory');
    console.log(`Inventory Items: ${inventory.length} documents`);
    
    const staff = await findMany('staff');
    console.log(`Staff Members: ${staff.length} documents`);
    
    const orders = await findMany('orders');
    console.log(`Orders: ${orders.length} documents`);
    
    // Show a sample of each collection
    if (categories.length > 0) {
      console.log('\nSample Category:', categories[0]);
    }
    
    if (menuItems.length > 0) {
      console.log('\nSample Menu Item:', menuItems[0]);
    }
    
    if (paymentMethods.length > 0) {
      console.log('\nSample Payment Method:', paymentMethods[0]);
    }
    
    if (customers.length > 0) {
      console.log('\nSample Customer:', customers[0]);
    }
    
    if (inventory.length > 0) {
      console.log('\nSample Inventory Item:', inventory[0]);
    }
    
    if (staff.length > 0) {
      console.log('\nSample Staff Member:', staff[0]);
    }
    
    if (orders.length > 0) {
      console.log('\nSample Order:', orders[0]);
    }
    
  } catch (error) {
    console.error('Error verifying data:', error);
  } finally {
    await dbManager.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the verification if this script is executed directly
if (require.main === module) {
  verifyData().catch(console.error);
}

export default verifyData;