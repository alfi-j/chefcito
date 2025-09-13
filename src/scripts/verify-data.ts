#!/usr/bin/env tsx

/**
 * Simple verification script to check populated data
 * This script verifies that the database has been populated correctly
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { query } from '../lib/db';

async function verifyData() {
  console.log('🔍 Verifying populated data...\n');
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  try {
    // Verify categories
    console.log('1. Checking categories...');
    const categoriesResult = await query('SELECT COUNT(*) as count FROM categories');
    console.log(`   📚 Categories: ${categoriesResult.rows[0].count}`);
    
    // Verify menu items
    console.log('2. Checking menu items...');
    const menuItemsResult = await query('SELECT COUNT(*) as count FROM menu_items');
    console.log(`   🍔 Menu Items: ${menuItemsResult.rows[0].count}`);
    
    // Verify orders
    console.log('3. Checking orders...');
    const ordersResult = await query('SELECT COUNT(*) as count FROM orders');
    console.log(`   🛎️ Orders: ${ordersResult.rows[0].count}`);
    
    // Verify customers
    console.log('4. Checking customers...');
    const customersResult = await query('SELECT COUNT(*) as count FROM customers');
    console.log(`   👥 Customers: ${customersResult.rows[0].count}`);
    
    // Verify staff
    console.log('5. Checking staff...');
    const staffResult = await query('SELECT COUNT(*) as count FROM staff');
    console.log(`   👷 Staff: ${staffResult.rows[0].count}`);
    
    // Verify tasks
    console.log('6. Checking tasks...');
    const tasksResult = await query('SELECT COUNT(*) as count FROM tasks');
    console.log(`   📋 Tasks: ${tasksResult.rows[0].count}`);
    
    // Verify payment methods
    console.log('7. Checking payment methods...');
    const paymentMethodsResult = await query('SELECT COUNT(*) as count FROM payment_methods');
    console.log(`   💳 Payment Methods: ${paymentMethodsResult.rows[0].count}`);
    
    // Verify inventory
    console.log('8. Checking inventory items...');
    const inventoryResult = await query('SELECT COUNT(*) as count FROM inventory');
    console.log(`   📦 Inventory Items: ${inventoryResult.rows[0].count}`);
    
    console.log('\n🎉 Data verification completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Categories: ${categoriesResult.rows[0].count}`);
    console.log(`   Menu Items: ${menuItemsResult.rows[0].count}`);
    console.log(`   Orders: ${ordersResult.rows[0].count}`);
    console.log(`   Customers: ${customersResult.rows[0].count}`);
    console.log(`   Staff: ${staffResult.rows[0].count}`);
    console.log(`   Tasks: ${tasksResult.rows[0].count}`);
    console.log(`   Payment Methods: ${paymentMethodsResult.rows[0].count}`);
    console.log(`   Inventory Items: ${inventoryResult.rows[0].count}`);
    
    // Show some sample data
    console.log('\n📋 Sample Categories:');
    const sampleCategories = await query('SELECT id, name FROM categories LIMIT 5');
    sampleCategories.rows.forEach((category: any) => {
      console.log(`   ${category.id}. ${category.name}`);
    });
    
    console.log('\n🍔 Sample Menu Items:');
    const sampleMenuItems = await query('SELECT name, price, category FROM menu_items LIMIT 5');
    sampleMenuItems.rows.forEach((item: any) => {
      console.log(`   ${item.name} - $${item.price} (${item.category})`);
    });
    
  } catch (error) {
    console.error('❌ Data verification failed:', error);
    process.exit(1);
  }
}

// Run the verification
verifyData();