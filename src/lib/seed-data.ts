import { v4 as uuidv4 } from 'uuid';
import CategoryModel from '@/models/Category';
import MenuItemModel from '@/models/MenuItem';
import WorkstationModel from '@/models/Workstation';
import PaymentModel from '@/models/Payment';

export async function seedRestaurantData(restaurantId: string) {
  const existingCategories = await CategoryModel.find({ restaurantId });
  if (existingCategories.length > 0) return;

  const catAppetizers = { id: uuidv4(), restaurantId, name: 'Appetizers' };
  const catMainCourse = { id: uuidv4(), restaurantId, name: 'Main Course' };
  const catDesserts = { id: uuidv4(), restaurantId, name: 'Desserts' };
  const catBeverages = { id: uuidv4(), restaurantId, name: 'Beverages' };

  await CategoryModel.insertMany([catAppetizers, catMainCourse, catDesserts, catBeverages]);

  await MenuItemModel.insertMany([
    {
      id: uuidv4(), restaurantId, name: 'French Fries', price: 5.99,
      category: catAppetizers.name, imageUrl: '', sortIndex: 0, available: true
    },
    {
      id: uuidv4(), restaurantId, name: 'Chicken Wings', price: 8.99,
      category: catAppetizers.name, imageUrl: '', sortIndex: 1, available: true
    },
    {
      id: uuidv4(), restaurantId, name: 'Grilled Chicken', price: 12.99,
      category: catMainCourse.name, imageUrl: '', sortIndex: 0, available: true
    },
    {
      id: uuidv4(), restaurantId, name: 'Beef Steak', price: 15.99,
      category: catMainCourse.name, imageUrl: '', sortIndex: 1, available: true
    },
    {
      id: uuidv4(), restaurantId, name: 'Caesar Salad', price: 9.99,
      category: catMainCourse.name, imageUrl: '', sortIndex: 2, available: true
    },
    {
      id: uuidv4(), restaurantId, name: 'Chocolate Cake', price: 6.99,
      category: catDesserts.name, imageUrl: '', sortIndex: 0, available: true
    },
    {
      id: uuidv4(), restaurantId, name: 'Ice Cream', price: 4.99,
      category: catDesserts.name, imageUrl: '', sortIndex: 1, available: true
    },
    {
      id: uuidv4(), restaurantId, name: 'Soda', price: 2.99,
      category: catBeverages.name, imageUrl: '', sortIndex: 0, available: true
    },
    {
      id: uuidv4(), restaurantId, name: 'Water', price: 1.99,
      category: catBeverages.name, imageUrl: '', sortIndex: 1, available: true
    },
    {
      id: uuidv4(), restaurantId, name: 'Coffee', price: 3.49,
      category: catBeverages.name, imageUrl: '', sortIndex: 2, available: true
    },
  ]);

  await WorkstationModel.insertMany([
    {
      id: uuidv4(), restaurantId, name: 'Kitchen',
      states: { new: 'new', inProgress: 'in progress', ready: 'ready' },
      position: 0
    },
    {
      id: uuidv4(), restaurantId, name: 'Bar',
      states: { new: 'new', inProgress: 'in progress', ready: 'ready' },
      position: 1
    },
    {
      id: uuidv4(), restaurantId, name: 'Ready',
      states: { new: 'new', inProgress: 'in progress', ready: 'ready' },
      position: 2
    },
  ]);

  await PaymentModel.insertMany([
    { id: uuidv4(), restaurantId, name: 'Cash', type: 'cash' as const, enabled: true },
    { id: uuidv4(), restaurantId, name: 'Card', type: 'card' as const, enabled: true },
  ]);
}
