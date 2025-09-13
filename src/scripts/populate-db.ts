#!/usr/bin/env tsx

/**
 * Script to populate the database with sample data
 * This script creates sample categories, menu items, and other data needed for the application
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { query, initializeDatabase } from '../lib/db';
import { 
  addMenuItem, 
  addPaymentMethod, 
  addCustomer, 
  addStaff,
  addInventoryItem,
  addTask
} from '../lib/mock-data';

async function populateDatabase() {
  console.log('🌱 Populating database with sample data...\n');
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  try {
    // Initialize the database (create tables if they don't exist)
    console.log('🏗️  Initializing database tables...');
    await initializeDatabase();
    console.log('✅ Database tables initialized\n');
    
    // Clear existing data (optional - uncomment if you want to start fresh)
    /*
    console.log('🗑️  Clearing existing data...');
    await query('DELETE FROM order_items');
    await query('DELETE FROM orders');
    await query('DELETE FROM menu_items');
    await query('DELETE FROM categories');
    await query('DELETE FROM payment_methods');
    await query('DELETE FROM customers');
    await query('DELETE FROM inventory');
    await query('DELETE FROM staff');
    await query('DELETE FROM tasks');
    console.log('✅ Existing data cleared\n');
    */
    
    // Create sample categories with integer IDs
    console.log('📚 Creating sample categories...');
    const categories = [
      { id: 1, name: 'Appetizers', isModifierGroup: false, linkedModifiers: [], parentId: null },
      { id: 2, name: 'Main Courses', isModifierGroup: false, linkedModifiers: [], parentId: null },
      { id: 3, name: 'Desserts', isModifierGroup: false, linkedModifiers: [], parentId: null },
      { id: 4, name: 'Beverages', isModifierGroup: false, linkedModifiers: [], parentId: null },
      { id: 5, name: 'Add-ons', isModifierGroup: true, linkedModifiers: [], parentId: null },
    ];
    
    // Insert categories directly since the addCategory function has issues with ID generation
    for (const category of categories) {
      await query(
        `INSERT INTO categories 
        (id, name, is_modifier_group, linked_modifiers, parent_id) 
        VALUES ($1, $2, $3, $4, $5)`,
        [
          category.id,
          category.name,
          category.isModifierGroup,
          category.linkedModifiers,
          category.parentId
        ]
      );
    }
    console.log('✅ Sample categories created\n');
    
    // Create sample menu items
    console.log('🍔 Creating sample menu items...');
    const menuItems = [
      // Appetizers
      {
        name: 'Caesar Salad',
        price: 8.99,
        description: 'Fresh romaine lettuce with Caesar dressing and croutons',
        available: true,
        category: 'Appetizers',
        imageUrl: '',
        aiHint: 'healthy, vegetarian',
        linkedModifiers: [],
        sortIndex: 0
      },
      {
        name: 'Garlic Bread',
        price: 5.99,
        description: 'Toasted bread with garlic butter',
        available: true,
        category: 'Appetizers',
        imageUrl: '',
        aiHint: 'vegetarian',
        linkedModifiers: [],
        sortIndex: 1
      },
      
      // Main Courses
      {
        name: 'Grilled Salmon',
        price: 18.99,
        description: 'Fresh salmon fillet with lemon and herbs',
        available: true,
        category: 'Main Courses',
        imageUrl: '',
        aiHint: 'healthy, gluten-free',
        linkedModifiers: [],
        sortIndex: 0
      },
      {
        name: 'Beef Burger',
        price: 14.99,
        description: 'Juicy beef patty with lettuce, tomato, and cheese',
        available: true,
        category: 'Main Courses',
        imageUrl: '',
        aiHint: '',
        linkedModifiers: [],
        sortIndex: 1
      },
      {
        name: 'Vegetable Pasta',
        price: 12.99,
        description: 'Pasta with seasonal vegetables in tomato sauce',
        available: true,
        category: 'Main Courses',
        imageUrl: '',
        aiHint: 'vegetarian, vegan option',
        linkedModifiers: [],
        sortIndex: 2
      },
      
      // Desserts
      {
        name: 'Chocolate Cake',
        price: 6.99,
        description: 'Rich chocolate cake with chocolate ganache',
        available: true,
        category: 'Desserts',
        imageUrl: '',
        aiHint: 'vegetarian',
        linkedModifiers: [],
        sortIndex: 0
      },
      {
        name: 'Ice Cream',
        price: 4.99,
        description: 'Vanilla ice cream with chocolate sauce',
        available: true,
        category: 'Desserts',
        imageUrl: '',
        aiHint: 'vegetarian',
        linkedModifiers: [],
        sortIndex: 1
      },
      
      // Beverages
      {
        name: 'Coffee',
        price: 2.99,
        description: 'Freshly brewed coffee',
        available: true,
        category: 'Beverages',
        imageUrl: '',
        aiHint: 'caffeine, vegetarian',
        linkedModifiers: [],
        sortIndex: 0
      },
      {
        name: 'Orange Juice',
        price: 3.99,
        description: 'Freshly squeezed orange juice',
        available: true,
        category: 'Beverages',
        imageUrl: '',
        aiHint: 'healthy, vegetarian, vegan',
        linkedModifiers: [],
        sortIndex: 1
      },
      
      // Add-ons (modifiers)
      {
        name: 'Extra Cheese',
        price: 1.99,
        description: 'Additional cheese on your dish',
        available: true,
        category: 'Add-ons',
        imageUrl: '',
        aiHint: 'vegetarian',
        linkedModifiers: [],
        sortIndex: 0
      },
      {
        name: 'Extra Sauce',
        price: 0.99,
        description: 'Additional sauce of your choice',
        available: true,
        category: 'Add-ons',
        imageUrl: '',
        aiHint: 'vegetarian, vegan option',
        linkedModifiers: [],
        sortIndex: 1
      }
    ];
    
    for (const item of menuItems) {
      await addMenuItem(item);
    }
    console.log('✅ Sample menu items created\n');
    
    // Create sample payment methods
    console.log('💳 Creating sample payment methods...');
    const paymentMethods = [
      { name: 'Cash', type: 'cash' as const, enabled: true, banks: [] },
      { name: 'Credit Card', type: 'card' as const, enabled: true, banks: [] },
      { name: 'Debit Card', type: 'card' as const, enabled: true, banks: [] },
      { name: 'PayPal', type: 'online' as const, enabled: true, banks: [] }
    ];
    
    for (const method of paymentMethods) {
      await addPaymentMethod(method);
    }
    console.log('✅ Sample payment methods created\n');
    
    // Create sample customers
    console.log('👥 Creating sample customers...');
    const customers = [
      { name: 'John Doe', email: 'john@example.com' },
      { name: 'Jane Smith', email: 'jane@example.com' },
      { name: 'Bob Johnson', email: 'bob@example.com' }
    ];
    
    for (const customer of customers) {
      await addCustomer(customer);
    }
    console.log('✅ Sample customers created\n');
    
    // Create sample staff
    console.log('👷 Creating sample staff...');
    const staff = [
      { name: 'Alice Manager', email: 'alice@restaurant.com', role: 'manager' as const, status: 'active' as const },
      { name: 'Bob Chef', email: 'bob@restaurant.com', role: 'chef' as const, status: 'active' as const },
      { name: 'Carol Waiter', email: 'carol@restaurant.com', role: 'waiter' as const, status: 'active' as const },
      { name: 'Dave Cashier', email: 'dave@restaurant.com', role: 'cashier' as const, status: 'active' as const }
    ];
    
    for (const member of staff) {
      await addStaff(member);
    }
    console.log('✅ Sample staff created\n');
    
    // Create sample inventory items
    console.log('📦 Creating sample inventory items...');
    const inventoryItems = [
      { name: 'Tomatoes', quantity: 50, unit: 'kg', reorderThreshold: 10, linkedItemIds: [], category: 'Vegetables' },
      { name: 'Ground Beef', quantity: 30, unit: 'kg', reorderThreshold: 5, linkedItemIds: [], category: 'Meat' },
      { name: 'Lettuce', quantity: 20, unit: 'heads', reorderThreshold: 5, linkedItemIds: [], category: 'Vegetables' },
      { name: 'Cheese', quantity: 15, unit: 'kg', reorderThreshold: 3, linkedItemIds: [], category: 'Dairy' },
      { name: 'Bread', quantity: 100, unit: 'pieces', reorderThreshold: 20, linkedItemIds: [], category: 'Bakery' }
    ];
    
    for (const item of inventoryItems) {
      await addInventoryItem(item);
    }
    console.log('✅ Sample inventory items created\n');
    
    // Create sample tasks
    console.log('📋 Creating sample tasks...');
    const tasks = [
      { 
        title: 'Restock vegetables', 
        description: 'Check and restock all vegetable supplies', 
        assignedTo: undefined, 
        reporterId: undefined, 
        status: 'todo' as const, 
        priority: 'medium' as const,
        createdAt: new Date()
      },
      { 
        title: 'Clean kitchen equipment', 
        description: 'Deep clean all kitchen equipment', 
        assignedTo: undefined, 
        reporterId: undefined, 
        status: 'todo' as const, 
        priority: 'low' as const,
        createdAt: new Date()
      },
      { 
        title: 'Update menu prices', 
        description: 'Review and update menu prices for seasonal items', 
        assignedTo: undefined, 
        reporterId: undefined, 
        status: 'todo' as const, 
        priority: 'high' as const,
        createdAt: new Date()
      }
    ];
    
    for (const task of tasks) {
      await addTask(task);
    }
    console.log('✅ Sample tasks created\n');
    
    console.log('🎉 Database population completed successfully!');
    console.log('\n📊 Summary of created data:');
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Menu Items: ${menuItems.length}`);
    console.log(`   Payment Methods: ${paymentMethods.length}`);
    console.log(`   Customers: ${customers.length}`);
    console.log(`   Staff: ${staff.length}`);
    console.log(`   Inventory Items: ${inventoryItems.length}`);
    console.log(`   Tasks: ${tasks.length}`);
    
  } catch (error) {
    console.error('❌ Database population failed:', error);
    process.exit(1);
  }
}

// Run the population script
populateDatabase();