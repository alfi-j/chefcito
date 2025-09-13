// Load environment variables when run as a standalone script
if (typeof require !== 'undefined' && require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '../../.env.local') });
}

import { query } from './db';
import categoriesData from '../data/categories.json';
import customersData from '../data/customers.json';
import inventoryData from '../data/inventory.json';
import menuItemsData from '../data/menu-items.json';
import ordersData from '../data/orders.json';
import paymentMethodsData from '../data/payment-methods.json';
import staffData from '../data/staff.json';
import tasksData from '../data/tasks.json';
import { addCategory, addMenuItem, addPaymentMethod, addOrder, addTask } from './mock-data';

export const migrateData = async () => {
  // Get all data from localStorage
  const storedTasks = localStorage.getItem('tasks');
  const storedOrders = localStorage.getItem('orders');
  const storedCategories = localStorage.getItem('categories');
  const storedMenuItems = localStorage.getItem('menuItems');
  const storedPaymentMethods = localStorage.getItem('paymentMethods');

  // Migrate tasks
  if (storedTasks) {
    try {
      const tasks: any[] = JSON.parse(storedTasks);
      const migratedTasks = tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'Medium',
        createdAt: task.createdAt || new Date().toISOString(),
        completedAt: task.completedAt || null,
        assignedTo: task.assignedTo || null,
      }));
      
      // Save to new storage
      await Promise.all(migratedTasks.map((task: any) => addTask(task)));
      console.log(`Migrated ${migratedTasks.length} tasks`);
    } catch (error) {
      console.error('Error migrating tasks:', error);
    }
  }

  // Migrate orders
  if (storedOrders) {
    try {
      const orders: any[] = JSON.parse(storedOrders);
      const migratedOrders = orders.map((order: any) => ({
        id: order.id,
        table: order.table,
        items: order.items.map((item: any) => ({
          id: item.id,
          // Fix: Use the correct structure for OrderItem
          menuItem: {
            id: item.menuItemId,
            // Other menuItem properties would be fetched from the database
          },
          quantity: item.quantity,
          newCount: item.newCount || item.quantity,
          cookingCount: item.cookingCount || 0,
          readyCount: item.readyCount || 0,
          servedCount: item.servedCount || 0,
          selectedExtras: item.selectedExtras || [],
          notes: item.notes || '',
        })),
        status: order.status || 'pending',
        createdAt: order.createdAt || new Date().toISOString(),
        completedAt: order.completedAt || null,
        total: order.total || 0,
        customerId: order.customerId || null,
        isPinned: order.isPinned || false,
        staffName: order.staffName || null,
        statusHistory: order.statusHistory || [],
        notes: order.notes || '',
        orderType: order.orderType || 'dine-in',
        deliveryInfo: order.deliveryInfo || null,
      }));
      
      // Save to new storage
      await Promise.all(migratedOrders.map((order: any) => addOrder(order)));
      console.log(`Migrated ${migratedOrders.length} orders`);
    } catch (error) {
      console.error('Error migrating orders:', error);
    }
  }

  // Migrate categories
  if (storedCategories) {
    try {
      const categories: any[] = JSON.parse(storedCategories);
      const migratedCategories = categories.map((category: any) => ({
        id: category.id,
        name: category.name,
        isModifierGroup: category.isModifierGroup || false,
        linkedModifiers: category.linkedModifiers || [],
        parentId: category.parentId || null,
      }));
      
      // Save to new storage
      await Promise.all(migratedCategories.map((category: any) => addCategory(category)));
      console.log(`Migrated ${migratedCategories.length} categories`);
    } catch (error) {
      console.error('Error migrating categories:', error);
    }
  }

  // Migrate menu items
  if (storedMenuItems) {
    try {
      const menuItems: any[] = JSON.parse(storedMenuItems);
      const migratedMenuItems = menuItems.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category,
        available: item.available !== false, // default to true if not set
        description: item.description || '',
        imageUrl: item.imageUrl || '',
        sortIndex: item.sortIndex || 0,
      }));
      
      // Save to new storage
      await Promise.all(migratedMenuItems.map((item: any) => addMenuItem(item)));
      console.log(`Migrated ${migratedMenuItems.length} menu items`);
    } catch (error) {
      console.error('Error migrating menu items:', error);
    }
  }

  // Migrate payment methods
  if (storedPaymentMethods) {
    try {
      const paymentMethods: any[] = JSON.parse(storedPaymentMethods);
      const migratedPaymentMethods = paymentMethods.map((method: any) => ({
        id: method.id,
        name: method.name,
        type: method.type,
        enabled: method.enabled !== false, // default to true if not set
        banks: method.banks || [],
      }));
      
      // Save to new storage
      await Promise.all(migratedPaymentMethods.map((method: any) => addPaymentMethod(method)));
      console.log(`Migrated ${migratedPaymentMethods.length} payment methods`);
    } catch (error) {
      console.error('Error migrating payment methods:', error);
    }
  }
};

// Run the migration if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  migrateData();
}