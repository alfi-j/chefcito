// Load environment variables when run as a standalone script
if (typeof require !== 'undefined' && require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '../../.env.local') });
}

import categoriesData from '../data/categories.json';
import customersData from '../data/customers.json';
import inventoryData from '../data/inventory.json';
import menuItemsData from '../data/menu-items.json';
import ordersData from '../data/orders.json';
import paymentMethodsData from '../data/payment-methods.json';
import staffData from '../data/staff.json';
import tasksData from '../data/tasks.json';

// Remove the import from mock-data and implement the functionality differently
// The actual data migration should be done through API routes or database scripts

export const migrateData = async () => {
  console.log('Data migration should be done through API routes or database scripts');
  console.log('This function is kept for compatibility but should not be used');
};

// Run the migration if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  migrateData();
}