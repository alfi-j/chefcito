import { v4 as uuidv4 } from 'uuid';
import CategoryModel from '@/models/Category';
import MenuItemModel from '@/models/MenuItem';
import WorkstationModel from '@/models/Workstation';
import PaymentModel from '@/models/Payment';
import debug from 'debug';

const log = debug('chefcito:seed');

export async function seedRestaurantData(restaurantId: string) {
  await seedCategories(restaurantId);
  await seedMenuItems(restaurantId);
  await seedWorkstations(restaurantId);
  await seedPayments(restaurantId);
}

async function seedCategories(restaurantId: string) {
  const existing = await CategoryModel.countDocuments({ restaurantId });
  if (existing > 0) {
    log('Categories already exist for %s, skipping', restaurantId);
    return;
  }

  const categories = [
    { id: uuidv4(), restaurantId, name: 'Appetizers' },
    { id: uuidv4(), restaurantId, name: 'Main Course' },
    { id: uuidv4(), restaurantId, name: 'Desserts' },
    { id: uuidv4(), restaurantId, name: 'Beverages' },
  ];

  await CategoryModel.insertMany(categories);
  log('Seeded %d categories for %s', categories.length, restaurantId);
}

async function seedMenuItems(restaurantId: string) {
  const existing = await MenuItemModel.countDocuments({ restaurantId });
  if (existing > 0) {
    log('Menu items already exist for %s, skipping', restaurantId);
    return;
  }

  const catAppetizers = await CategoryModel.findOne({ restaurantId, name: 'Appetizers' });
  const catMainCourse = await CategoryModel.findOne({ restaurantId, name: 'Main Course' });
  const catDesserts = await CategoryModel.findOne({ restaurantId, name: 'Desserts' });
  const catBeverages = await CategoryModel.findOne({ restaurantId, name: 'Beverages' });

  const items = [
    { id: uuidv4(), restaurantId, name: 'French Fries', price: 5.99, category: catAppetizers?.name || 'Appetizers', imageUrl: '', sortIndex: 0, available: true },
    { id: uuidv4(), restaurantId, name: 'Chicken Wings', price: 8.99, category: catAppetizers?.name || 'Appetizers', imageUrl: '', sortIndex: 1, available: true },
    { id: uuidv4(), restaurantId, name: 'Grilled Chicken', price: 12.99, category: catMainCourse?.name || 'Main Course', imageUrl: '', sortIndex: 0, available: true },
    { id: uuidv4(), restaurantId, name: 'Beef Steak', price: 15.99, category: catMainCourse?.name || 'Main Course', imageUrl: '', sortIndex: 1, available: true },
    { id: uuidv4(), restaurantId, name: 'Caesar Salad', price: 9.99, category: catMainCourse?.name || 'Main Course', imageUrl: '', sortIndex: 2, available: true },
    { id: uuidv4(), restaurantId, name: 'Chocolate Cake', price: 6.99, category: catDesserts?.name || 'Desserts', imageUrl: '', sortIndex: 0, available: true },
    { id: uuidv4(), restaurantId, name: 'Ice Cream', price: 4.99, category: catDesserts?.name || 'Desserts', imageUrl: '', sortIndex: 1, available: true },
    { id: uuidv4(), restaurantId, name: 'Soda', price: 2.99, category: catBeverages?.name || 'Beverages', imageUrl: '', sortIndex: 0, available: true },
    { id: uuidv4(), restaurantId, name: 'Water', price: 1.99, category: catBeverages?.name || 'Beverages', imageUrl: '', sortIndex: 1, available: true },
    { id: uuidv4(), restaurantId, name: 'Coffee', price: 3.49, category: catBeverages?.name || 'Beverages', imageUrl: '', sortIndex: 2, available: true },
  ];

  await MenuItemModel.insertMany(items);
  log('Seeded %d menu items for %s', items.length, restaurantId);
}

async function seedWorkstations(restaurantId: string) {
  const existing = await WorkstationModel.countDocuments({ restaurantId });
  if (existing > 0) {
    log('Workstations already exist for %s, skipping', restaurantId);
    return;
  }

  const workstations = [
    { id: uuidv4(), restaurantId, name: 'Kitchen', states: { new: 'new', inProgress: 'in progress', ready: 'ready' }, position: 0, isFixed: true },
    { id: uuidv4(), restaurantId, name: 'Bar', states: { new: 'new', inProgress: 'in progress', ready: 'ready' }, position: 1, isFixed: false },
    { id: uuidv4(), restaurantId, name: 'Ready', states: { new: 'new', inProgress: 'in progress', ready: 'ready' }, position: 2, isFixed: true },
  ];

  await WorkstationModel.insertMany(workstations);
  log('Seeded %d workstations for %s', workstations.length, restaurantId);
}

async function seedPayments(restaurantId: string) {
  const existing = await PaymentModel.countDocuments({ restaurantId });
  if (existing > 0) {
    log('Payments already exist for %s, skipping', restaurantId);
    return;
  }

  const payments = [
    { id: uuidv4(), restaurantId, name: 'Cash', type: 'cash' as const, enabled: true },
    { id: uuidv4(), restaurantId, name: 'Card', type: 'card' as const, enabled: true },
  ];

  await PaymentModel.insertMany(payments);
  log('Seeded %d payment methods for %s', payments.length, restaurantId);
}
