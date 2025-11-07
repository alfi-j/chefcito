import { 
  type ICategory as Category, 
  type IMenuItem as MenuItem, 
  type IOrder as Order, 
  type IInventoryItem as Inventory, 
  type ICustomer as Customer, 
  type IUser as User, 
  type IWorkstation as Workstation, 
  type IPayment as Payment
} from '@/models';
import { DateRange } from 'react-day-picker';
import { subDays, eachDayOfInterval, format, differenceInMinutes } from 'date-fns';
import { type OrderItem } from './types';
import debug from 'debug';

// Direct model imports to avoid recompilation issues
import CategoryModel from '../models/Category';
import MenuItemModel from '../models/MenuItem';
import OrderModel from '../models/Order';
import InventoryModel from '../models/Inventory';
import CustomerModel from '../models/Customer';
import PaymentModel from '../models/Payment';
import UserModel from '../models/User';
import WorkstationModel from '../models/Workstation';


// Import Mongoose and database service
import mongoose from 'mongoose';
import databaseService from '../services/database.service';

// Debug loggers
import { debugInventory, debugOrders } from './debug-utils';

// Generate a random ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Initialize database connection
const initializeDatabase = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  
  if (mongoose.connection.readyState !== 1) {
    try {
      await databaseService.connect(MONGODB_URI);
    } catch (error) {
      console.error('Failed to initialize database connection:', error);
      throw error;
    }
  }
};

// Helper function to get all menu items for order inflation
const getAllMenuItems = async () => {
  await initializeDatabase();
  const menuItems = await MenuItemModel.find({});
  return menuItems.map(item => item.toObject());
};

const inflateOrder = async (order: any, allMenuItems: MenuItem[]): Promise<Order> => {
  const inflatedItems = await Promise.all(order.items.map(async (item: any) => {
    const menuItem = allMenuItems.find(mi => mi.id === item.menuItemId);
    if (!menuItem) {
      console.warn(`Menu item with ID ${item.menuItemId} not found for order ${order.id}`);
      return null;
    }
    
    const selectedExtras = await Promise.all((item.selectedExtraIds || []).map(async (extraId: string) => {
      const extraItem = allMenuItems.find(mi => mi.id === extraId);
      if(!extraItem) {
        console.warn(`Extra item with ID ${extraId} not found for order item ${item.id}`);
        return null;
      }
      return extraItem;
    }));

    // Ensure item has a status field with default value if missing
    let status: 'new' | 'in-progress' | 'ready' | 'served' | string = item.status || 'new';

    const quantity = item.quantity || 0;

    return {
      ...item,
      menuItem,
      selectedExtras: selectedExtras.filter(e => e !== null) as MenuItem[],
      quantity: quantity,
      status: status,
    };
  }));

  return {
    ...order,
    createdAt: new Date(order.createdAt),
    completedAt: order.completedAt ? new Date(order.completedAt) : undefined,
    items: inflatedItems.filter(i => i !== null) as OrderItem[],
  };
};

// Users
export const getUsers = async () => {
  await initializeDatabase();
  const users = await UserModel.find({}).maxTimeMS(10000);
  return users.map(user => user.toObject());
};

export const getUserPerformance = async (dateRange?: DateRange) => {
  const users = await getUsers();
  const orders = await getInitialOrders();
  
  const completedOrders = orders.filter(o => {
    if (o.status !== 'completed' || !o.completedAt) return false;
    if (!dateRange || !dateRange.from) return true;
    const completedAt = new Date(o.completedAt);
    const to = dateRange.to || new Date();
    return completedAt >= dateRange.from && completedAt <= to;
  });

  const performanceData = users.map(user => {
    const userOrders = completedOrders.filter(o => o.staffName === user.name);
    const totalSales = userOrders.reduce((acc, order) => acc + getOrderTotal(order), 0);
    const tablesServed = new Set(userOrders.map(o => o.table)).size;
    const avgSaleValue = userOrders.length > 0 ? totalSales / userOrders.length : 0;

    return {
      ...user,
      tablesServed,
      totalSales,
      avgSaleValue
    };
  });

  return performanceData.sort((a, b) => b.totalSales - a.totalSales);
};

// Customers
export const getCustomers = async (): Promise<Customer[]> => {
  await initializeDatabase();
  const customers = await CustomerModel.find({}).maxTimeMS(10000);
  return customers.map(customer => customer.toObject());
};

export const addCustomer = async (customerData: Omit<Customer, 'id'>) => {
  const newCustomer = new CustomerModel({ 
    id: generateId(),
    ...customerData
  });
  await newCustomer.save();
  return newCustomer.toObject();
};

export const updateCustomer = async (id: string, customerData: Partial<Customer>) => {
  const result = await CustomerModel.updateOne(
    { id },
    { $set: customerData }
  );
  
  return result.modifiedCount > 0;
};

export const deleteCustomer = async (id: string) => {
  const result = await CustomerModel.deleteOne({ id });
  return result.deletedCount > 0;
};

// Categories
export const getCategories = async (): Promise<Category[]> => {
  try {
    await initializeDatabase();
    const categories = await CategoryModel.find({}).maxTimeMS(10000);
    return categories.map(category => category.toObject());
  } catch (error: any) {
    console.error('Error fetching categories from database:', error);
    // Provide more context in the error message
    if (error.name === 'MongoNetworkError' || error.name === 'MongooseServerSelectionError') {
      throw new Error('Database connection failed. Please check your MongoDB connection.');
    }
    if (error.name === 'MongoTimeoutError' || (error.message && error.message.includes('buffering timed out'))) {
      throw new Error('Database operation timed out. The database may be slow or unreachable.');
    }
    throw new Error(`Database error: ${error.message}`);
  }
};

export const addCategory = async (categoryData: Omit<Category, 'id'>) => {
  const newCategory = new CategoryModel({ 
    id: generateId(),
    ...categoryData
  });
  await newCategory.save();
  return newCategory.toObject();
};

export const updateCategory = async (id: string, categoryData: Partial<Category>) => {
  const result = await CategoryModel.updateOne(
    { id },
    { $set: categoryData }
  );
  
  return result.modifiedCount > 0;
};

export const deleteCategory = async (id: string) => {
  const result = await CategoryModel.deleteOne({ id });
  return result.deletedCount > 0;
};

// Menu Items
export const getMenuItems = async (): Promise<MenuItem[]> => {
  await initializeDatabase();
  const menuItems = await MenuItemModel.find({}).maxTimeMS(10000);
  return menuItems.map(item => item.toObject());
};

export const addMenuItem = async (itemData: Omit<MenuItem, 'id'>) => {
  const newItem = new MenuItemModel({ 
    id: generateId(),
    ...itemData
  });
  await newItem.save();
  return newItem.toObject();
};

export const updateMenuItem = async (id: string, itemData: Partial<MenuItem>) => {
  const result = await MenuItemModel.updateOne(
    { id },
    { $set: itemData }
  );
  
  return result.modifiedCount > 0;
};

export const deleteMenuItem = async (id: string) => {
  const result = await MenuItemModel.deleteOne({ id });
  return result.deletedCount > 0;
};

// Orders
const getOrderTotal = (order: Order): number => {
  return order.items.reduce((total, item) => {
    return total + (item.menuItem.price * item.quantity);
  }, 0);
};

export const getInitialOrders = async (): Promise<Order[]> => {
  await initializeDatabase();
  const orders = await OrderModel.find({}).sort({ createdAt: -1 }).maxTimeMS(10000);
  const menuItems = await getAllMenuItems();
  return Promise.all(orders.map(order => inflateOrder(order.toObject(), menuItems)));
};

export const addOrder = async (orderData: Omit<Order, 'id' | 'createdAt'>) => {
  // Get the highest existing order ID and increment by 1
  const latestOrder = await OrderModel.findOne({}).sort({ id: -1 }).limit(1);
  const newId = latestOrder ? latestOrder.id + 1 : 1;
  
  const newOrder = new OrderModel({ 
    id: newId,
    createdAt: new Date(),
    ...orderData
  });
  await newOrder.save();
  return newOrder.toObject();
};

export const updateOrderStatus = async (id: number, newStatus: string) => {
  const order = await OrderModel.findOne({ id });
  if (order) {
    const now = new Date();
    if (newStatus === 'completed') {
      order.completedAt = now;
    } else {
      // Remove completedAt timestamp if reverted
      order.completedAt = undefined;
    }
    
    if (!order.statusHistory) {
      order.statusHistory = [];
    }
    
    order.statusHistory.push({ status: newStatus, timestamp: now });
    
    await order.save();
    return true;
  }
  return false;
};

export const deleteOrder = async (id: number) => {
  debugOrders('deleteOrder: called with id %d', id);
  console.log('deleteOrder: called with id:', id);
  
  try {
    // Initialize database connection
    await initializeDatabase();
    
    // First check if the order exists
    const orderExists = await OrderModel.findOne({ id });
    debugOrders('deleteOrder: order exists check %O', orderExists);
    console.log('deleteOrder: order exists check:', orderExists);
    
    if (!orderExists) {
      debugOrders('deleteOrder: order with id %d not found', id);
      console.log('deleteOrder: order with id not found:', id);
      return false;
    }
    
    const result = await OrderModel.deleteOne({ id });
    debugOrders('deleteOrder: deleteOne result %O', result);
    console.log('deleteOrder: deleteOne result:', result);
    console.log('deleteOrder: deletedCount:', result.deletedCount);
    return result.deletedCount > 0;
  } catch (error) {
    debugOrders('deleteOrder: error %O', error);
    console.error('deleteOrder: error:', error);
    return false;
  }
};

export const updateOrder = async (id: number, orderData: Partial<Order>) => {
  const result = await OrderModel.updateOne(
    { id },
    { $set: orderData }
  );
  
  return result.modifiedCount > 0;
};

export const toggleOrderPin = async ({ orderId }: { orderId: number }) => {
  try {
    const order = await OrderModel.findOne({ id: orderId });
    if (!order) {
      return { success: false, error: 'Order not found' };
    }
    
    order.isPinned = !order.isPinned;
    await order.save();
    
    return { success: true, isPinned: order.isPinned };
  } catch (error: any) {
    console.error('Error toggling order pin:', error);
    return { success: false, error: error.message };
  }
};

export const updateOrderItemStatus = async ({ orderId, itemId, status }: { orderId: number; itemId: string; status: string }) => {
  try {
    const order = await OrderModel.findOne({ id: orderId });
    if (!order) {
      throw new Error('Order not found');
    }
    
    const item = order.items.find((item: any) => item.id === itemId);
    if (!item) {
      throw new Error('Item not found in order');
    }
    
    item.status = status;
    await order.save();
    
    return true;
  } catch (error: any) {
    console.error('Error updating order item status:', error);
    throw error;
  }
};

// Payment Methods
export const getPaymentMethods = async (): Promise<Payment[]> => {
  await initializeDatabase();
  const paymentMethods = await PaymentModel.find({}).maxTimeMS(10000);
  return paymentMethods.map(method => method.toObject());
};

export const addPaymentMethod = async (methodData: Omit<Payment, 'id'>) => {
  try {
    // Ensure banks array is handled properly for new payment methods
    const newMethodData = { ...methodData };
    if (newMethodData.type && newMethodData.type !== 'bank_transfer') {
      // If type is not bank_transfer, ensure banks array is empty
      newMethodData.banks = [];
    }
    
    const newMethod = new PaymentModel({ 
      id: generateId(),
      ...newMethodData
    });
    await newMethod.save();
    return newMethod.toObject();
  } catch (error) {
    console.error('Error adding payment method:', error);
    throw error;
  }
};

export const updatePaymentMethod = async (id: string, methodData: Partial<Payment>) => {
  try {
    // Ensure banks array is handled properly
    const updateData = { ...methodData };
    if (updateData.type && updateData.type !== 'bank_transfer') {
      // If type is not bank_transfer, ensure banks array is empty
      updateData.banks = [];
    }
    
    const result = await PaymentModel.updateOne(
      { id },
      { $set: updateData }
    );
    
    if (result.modifiedCount > 0) {
      // Return the updated payment method
      const updatedMethod = await PaymentModel.findOne({ id });
      return updatedMethod ? updatedMethod.toObject() : null;
    }
    
    return null;
  } catch (error) {
    console.error('Error updating payment method:', error);
    throw error;
  }
};

export const deletePaymentMethod = async (id: string) => {
  try {
    const result = await PaymentModel.deleteOne({ id });
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting payment method:', error);
    throw error;
  }
};



// Inventory
export const getInventory = async (): Promise<Inventory[]> => {
  debugInventory('getInventory: called');
  await initializeDatabase();
  const inventory = await InventoryModel.find({}).maxTimeMS(10000);
  const result = inventory.map(item => {
    const itemObj = item.toObject();
    // Convert Date to string for lastRestocked
    return {
      ...itemObj,
      lastRestocked: itemObj.lastRestocked.toISOString()
    };
  });
  debugInventory('getInventory: returning %d items', result.length);
  return result;
};

export const addInventoryItem = async (itemData: Omit<Inventory, 'id'>) => {
  debugInventory('addInventoryItem: called with data %O', itemData);
  const newItem = new InventoryModel({ 
    id: generateId(),
    ...itemData,
    lastRestocked: new Date()
  });
  await newItem.save();
  const savedItem = newItem.toObject();
  const result = {
    ...savedItem,
    lastRestocked: savedItem.lastRestocked.toISOString()
  };
  debugInventory('addInventoryItem: successfully added item with id %s', result.id);
  return result;
};

export const updateInventoryItem = async (id: string, itemData: Partial<Inventory>) => {
  debugInventory('updateInventoryItem: called with id %s and data %O', id, itemData);
  const result = await InventoryModel.updateOne(
    { id },
    { $set: itemData }
  );
  debugInventory('updateInventoryItem: modified %d documents', result.modifiedCount);
  return result.modifiedCount > 0;
};

export const deleteInventoryItem = async (id: string) => {
  debugInventory('deleteInventoryItem: called with id %s', id);
  const result = await InventoryModel.deleteOne({ id });
  debugInventory('deleteInventoryItem: deleted %d documents', result.deletedCount);
  return result.deletedCount > 0;
};

export const updateInventoryStock = async (id: string, quantity: number) => {
  debugInventory('updateInventoryStock: called with id %s and quantity %d', id, quantity);
  const result = await InventoryModel.updateOne(
    { id },
    { $set: { quantity, lastRestocked: new Date() } }
  );
  debugInventory('updateInventoryStock: modified %d documents', result.modifiedCount);
  
  if (result.modifiedCount > 0) {
    // Return the updated inventory item
    const updatedItem = await InventoryModel.findOne({ id });
    if (updatedItem) {
      const itemObj = updatedItem.toObject();
      return {
        ...itemObj,
        lastRestocked: itemObj.lastRestocked.toISOString()
      };
    }
  }
  
  return null;
};


// Reporting
const getOrderTotalReport = (order: Order): number => {
  return order.items.reduce((total, item) => {
    return total + (item.menuItem.price * item.quantity);
  }, 0);
};

export const getSalesReport = async (dateRange: DateRange) => {
  const orders = await getInitialOrders();
  
  // Filter orders by date range
  const filteredOrders = orders.filter(order => {
    if (!order.completedAt) return false;
    const completedAt = new Date(order.completedAt);
    return completedAt >= dateRange.from! && completedAt <= (dateRange.to || new Date());
  });
  
  // Calculate statistics
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + getOrderTotalReport(order), 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  // Group by day for chart data
  const dailySales: { date: string; revenue: number }[] = [];
  const days = eachDayOfInterval({ start: dateRange.from!, end: dateRange.to || new Date() });
  
  days.forEach(day => {
    const dayOrders = filteredOrders.filter(order => {
      if (!order.completedAt) return false;
      const completedAt = new Date(order.completedAt);
      return format(completedAt, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
    });
    
    const dayRevenue = dayOrders.reduce((sum, order) => sum + getOrderTotalReport(order), 0);
    dailySales.push({
      date: format(day, 'MMM dd'),
      revenue: dayRevenue
    });
  });
  
  return {
    totalRevenue,
    totalOrders,
    avgOrderValue,
    dailySales
  };
};

export const getItemsReport = async (dateRange: DateRange) => {
  const orders = await getInitialOrders();
  
  // Filter orders by date range
  const filteredOrders = orders.filter(order => {
    if (!order.completedAt) return false;
    const completedAt = new Date(order.completedAt);
    return completedAt >= dateRange.from! && completedAt <= (dateRange.to || new Date());
  });
  
  // Aggregate item sales
  const itemSales: Record<string, { name: string; quantity: number; total: number }> = {};
  
  filteredOrders.forEach(order => {
    order.items.forEach(item => {
      const itemId = item.menuItem.id;
      if (!itemSales[itemId]) {
        itemSales[itemId] = {
          name: item.menuItem.name,
          quantity: 0,
          total: 0
        };
      }
      
      itemSales[itemId].quantity += item.quantity;
      itemSales[itemId].total += item.menuItem.price * item.quantity;
    });
  });
  
  // Convert to array and sort by quantity
  const sortedItems = Object.values(itemSales).sort((a, b) => b.quantity - a.quantity);
  
  return {
    bestSelling: sortedItems.slice(0, 10),
    leastSelling: sortedItems.slice(-10).reverse()
  };
};

export const getKitchenReport = async (dateRange: DateRange) => {
  const orders = await getInitialOrders();
  
  // Filter orders by date range
  const filteredOrders = orders.filter(order => {
    if (!order.completedAt) return false;
    const completedAt = new Date(order.completedAt);
    return completedAt >= dateRange.from! && completedAt <= (dateRange.to || new Date());
  });
  
  // Calculate average preparation time
  let totalPrepTime = 0;
  let completedItemCount = 0;
  
  const itemPrepTimes: Record<string, { name: string; totalTime: number; count: number }> = {};
  
  filteredOrders.forEach(order => {
    if (!order.completedAt || !order.createdAt) return;
    
    const prepTime = differenceInMinutes(new Date(order.completedAt), new Date(order.createdAt));
    totalPrepTime += prepTime;
    
    order.items.forEach(item => {
      const itemId = item.menuItem.id;
      if (!itemPrepTimes[itemId]) {
        itemPrepTimes[itemId] = {
          name: item.menuItem.name,
          totalTime: 0,
          count: 0
        };
      }
      
      itemPrepTimes[itemId].totalTime += prepTime;
      itemPrepTimes[itemId].count += 1;
    });
    
    completedItemCount += order.items.length;
  });
  
  const avgPrepTime = completedItemCount > 0 ? totalPrepTime / completedItemCount : 0;
  
  // Calculate average prep time per item
  const itemsWithAvgTime = Object.entries(itemPrepTimes).map(([id, data]) => ({
    ...data,
    avgTime: data.count > 0 ? data.totalTime / data.count : 0
  }));
  
  // Sort by average time (descending) to find most delayed items
  const mostDelayedItems = itemsWithAvgTime
    .sort((a, b) => b.avgTime - a.avgTime)
    .slice(0, 10);
  
  return {
    avgPrepTime,
    mostDelayedItems
  };
};

// Workstations
export const getWorkstations = async (): Promise<Workstation[]> => {
  await initializeDatabase();
  const workstations = await WorkstationModel.find({}).sort({ position: 1 }).maxTimeMS(10000);
  return workstations.map(workstation => workstation.toObject());
};

export const addWorkstation = async (workstationData: Omit<Workstation, 'id'>) => {
  // Get the highest position value and add 1
  const workstations = await getWorkstations();
  const maxPosition = workstations.length > 0 ? Math.max(...workstations.map(w => w.position || 0)) : 0;
  
  const newWorkstation = new WorkstationModel({ 
    id: generateId(),
    ...workstationData,
    position: maxPosition + 1
  });
  await newWorkstation.save();
  return newWorkstation.toObject();
};

export const updateWorkstation = async (id: string, workstationData: Partial<Workstation>) => {
  const result = await WorkstationModel.updateOne(
    { id },
    { $set: workstationData }
  );
  
  return result.modifiedCount > 0;
};

export const deleteWorkstation = async (id: string) => {
  const result = await WorkstationModel.deleteOne({ id });
  return result.deletedCount > 0;
};

export const updateWorkstationPositions = async (positions: { id: string; position: number }[]) => {
  try {
    const bulkOps = positions.map(({ id, position }) => ({
      updateOne: {
        filter: { id },
        update: { $set: { position } }
      }
    }));
    
    const result = await WorkstationModel.bulkWrite(bulkOps);
    return result.modifiedCount || 0;
  } catch (error) {
    console.error('Error updating workstation positions:', error);
    throw error;
  }
};
