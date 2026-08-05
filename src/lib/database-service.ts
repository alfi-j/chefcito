import {
  type MenuItem,
  type Order,
  type InventoryItem as Inventory,
  type Customer,
  type Payment,
  type Category
} from '@/lib/types';
import { type IWorkstation as Workstation } from '@/models/index';
import { DateRange } from 'react-day-picker';
import { eachDayOfInterval, format, differenceInMinutes } from 'date-fns';
import { type OrderItem } from '@/lib/types';
import { getItemTotal, getOrderTotal } from '@/lib/helpers';

// Direct model imports to avoid recompilation issues
import {
  Category as CategoryModel,
  MenuItem as MenuItemModel,
  Order as OrderModel,
  Inventory as InventoryModel,
  Customer as CustomerModel,
  Payment as PaymentModel,
  User as UserModel,
  Workstation as WorkstationModel,
  OrderCounter as OrderCounterModel
} from '@/models/index';


// Import Mongoose
import mongoose from 'mongoose';

// Debug loggers - imported from centralized helpers
import { debugInventory, debugOrders } from '@/lib/helpers';

// Generate a random ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Minimal shapes for documents inflated from the database
interface InflateOrderItem {
  id?: string;
  name?: string;
  price?: number;
  menuItemId?: string;
  quantity?: number;
  status?: string;
  workstationId?: string;
  selectedExtraIds?: string[];
  [key: string]: unknown;
}

interface InflateOrder {
  id?: string | number;
  createdAt?: string | Date;
  completedAt?: string | Date | null;
  items: InflateOrderItem[];
  [key: string]: unknown;
}

interface InflateWorkstation {
  id?: string;
  _id?: { toString(): string };
  name?: string;
  position?: number;
  [key: string]: unknown;
}

// Initialize database connection
export const initializeDatabase = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

  if (mongoose.connection.readyState !== 1) {
    try {
      // MONGODB_DB overrides the database name in the URI (useful when the URI
      // doesn't embed a database name, e.g. mongodb://localhost:27017)
      const options = process.env.MONGODB_DB ? { dbName: process.env.MONGODB_DB } : {};
      await mongoose.connect(MONGODB_URI, options);
    } catch (error) {
      console.error('Failed to initialize database connection:', error);
      throw error;
    }
  }
};

// Helper function to get all menu items for order inflation
const getAllMenuItems = async (restaurantId?: string) => {
  await initializeDatabase();
  const query = restaurantId ? { restaurantId } : {};
  const menuItems = await MenuItemModel.find(query);
  return menuItems.map(item => item.toObject());
};

const inflateOrder = async (order: InflateOrder, allMenuItems: MenuItem[], allWorkstations: InflateWorkstation[]): Promise<Order> => {
  const workstations = allWorkstations;
  
  const inflatedItems = await Promise.all(order.items.map(async (item: InflateOrderItem) => {
    const menuItem = allMenuItems.find(mi => mi.id === item.menuItemId);
    if (!menuItem) {
      console.warn(
        `Menu item with ID ${item.menuItemId} not found for order ${order.id}: ` +
        `keeping item "${item.name || 'unknown'}" as placeholder`
      );
      // Return a placeholder item instead of dropping silently
      return {
        ...item,
        menuItem: {
          id: item.menuItemId,
          name: item.name || '(deleted item)',
          price: item.price || 0,
          category: '',
          linkedModifiers: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        selectedExtras: [] as MenuItem[],
        quantity: item.quantity || 0,
        status: item.status || 'New',
        workstationId: item.workstationId || (workstations[0]?.id || null),
      };
    }

    const selectedExtras: (MenuItem | null)[] = (item.selectedExtraIds || []).map((extraId: string) => {
      const extraItem = allMenuItems.find(mi => mi.id === extraId);
      if (!extraItem) {
        console.warn(`Extra item with ID ${extraId} not found for order item ${item.id}, skipping`);
        return null;
      }
      return extraItem;
    });

    // Ensure item has a status field with default value if missing
    let status: 'New' | 'In Progress' | 'Ready' | 'served' | string = item.status || 'New';
    
    // Special case: If the item is in the Ready workstation, make sure its status is Ready
    if (item.workstationId) {
      const workstation = workstations.find(ws => ws.id === item.workstationId);
      if (workstation && workstation.name?.toLowerCase() === 'ready') {
        status = 'Ready';
      }
    }

    const quantity = item.quantity || 0;

    return {
      ...item,
      menuItem,
      selectedExtras: selectedExtras.filter(e => e !== null) as MenuItem[],
      quantity: quantity,
      status: status,
      workstationId: item.workstationId || (workstations[0]?.id || null)
    };
  }));

  return {
    ...order,
    createdAt: new Date(order.createdAt as string | Date),
    completedAt: order.completedAt ? new Date(order.completedAt) : undefined,
    items: inflatedItems as OrderItem[],
  } as Order;
};

// Users
export const getUsers = async (restaurantId?: string) => {
  await initializeDatabase();
  const query = restaurantId ? { restaurantId } : {};
  const users = await UserModel.find(query).maxTimeMS(10000);
  return users.map(user => user.toObject());
};

export const getUserPerformance = async (dateRange?: DateRange, restaurantId?: string) => {
  const users = await getUsers(restaurantId);
  const orders = await getInitialOrders(restaurantId);

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
export const getCustomers = async (restaurantId?: string): Promise<Customer[]> => {
  await initializeDatabase();
  const query = restaurantId ? { restaurantId } : {};
  const customers = await CustomerModel.find(query).maxTimeMS(10000);
  return customers.map(customer => customer.toObject());
};

export const addCustomer = async (customerData: Omit<Customer, 'id'>) => {
  if (!customerData.restaurantId) {
    throw new Error('restaurantId is required when creating a customer');
  }
  const newCustomer = new CustomerModel({
    id: generateId(),
    ...customerData
  });
  await newCustomer.save();
  return newCustomer.toObject();
};

export const updateCustomer = async (id: string, restaurantId: string, customerData: Partial<Customer>) => {
  const result = await CustomerModel.updateOne(
    { id, restaurantId },
    { $set: customerData }
  );

  return result.modifiedCount > 0;
};

export const deleteCustomer = async (id: string, restaurantId: string) => {
  const result = await CustomerModel.deleteOne({ id, restaurantId });
  return result.deletedCount > 0;
};

// Categories
export const getCategories = async (restaurantId: string): Promise<Category[]> => {
  try {
    await initializeDatabase();
    const categories = await CategoryModel.find({ restaurantId }).maxTimeMS(10000);
    return categories.map(category => category.toObject());
  } catch (error) {
    console.error('Error fetching categories from database:', error);
    const err = error as { name?: string; message?: string };
    // Provide more context in the error message
    if (err.name === 'MongoNetworkError' || err.name === 'MongooseServerSelectionError') {
      throw new Error('Database connection failed. Please check your MongoDB connection.');
    }
    if (err.name === 'MongoTimeoutError' || (err.message && err.message.includes('buffering timed out'))) {
      throw new Error('Database operation timed out. The database may be slow or unreachable.');
    }
    throw new Error(`Database error: ${err.message}`);
  }
};

export const addCategory = async (categoryData: Omit<Category, 'id'> & { restaurantId: string }) => {
  const newCategory = new CategoryModel({
    id: generateId(),
    ...categoryData,
    restaurantId: categoryData.restaurantId
  });
  await newCategory.save();
  return newCategory.toObject();
};

export const updateCategory = async (id: string, restaurantId: string, categoryData: Partial<Category>) => {
  const result = await CategoryModel.updateOne(
    { id, restaurantId },
    { $set: categoryData }
  );

  return result.modifiedCount > 0;
};

export const deleteCategory = async (id: string, restaurantId: string) => {
  const result = await CategoryModel.deleteOne({ id, restaurantId });
  return result.deletedCount > 0;
};

// Menu Items
export const getMenuItems = async (restaurantId?: string): Promise<MenuItem[]> => {
  await initializeDatabase();
  const query = restaurantId ? { restaurantId } : {};
  const menuItems = await MenuItemModel.find(query).maxTimeMS(10000);
  return menuItems.map(item => item.toObject());
};

export const addMenuItem = async (itemData: Omit<MenuItem, 'id'> & { restaurantId: string }) => {
  if (!itemData.restaurantId) {
    throw new Error('restaurantId is required when creating a menu item');
  }
  const newItem = new MenuItemModel({
    id: generateId(),
    ...itemData
  });
  await newItem.save();
  return newItem.toObject();
};

export const updateMenuItem = async (id: string, restaurantId: string, itemData: Partial<MenuItem>) => {
  const result = await MenuItemModel.updateOne(
    { id, restaurantId },
    { $set: itemData }
  );

  if (result.modifiedCount > 0) {
    const updatedItem = await MenuItemModel.findOne({ id, restaurantId });
    return updatedItem ? updatedItem.toObject() : null;
  }

  return null;
};

export const deleteMenuItem = async (id: string, restaurantId: string) => {
  const result = await MenuItemModel.deleteOne({ id, restaurantId });
  return result.deletedCount > 0;
};

// Orders
// getOrderTotal moved to helpers.ts for consistency

export const getInitialOrders = async (restaurantId?: string): Promise<Order[]> => {
  await initializeDatabase();
  const query = restaurantId ? { restaurantId } : {};
  const wsQuery = restaurantId ? { restaurantId } : {};
  const [orders, menuItems, workstations] = await Promise.all([
    OrderModel.find(query).sort({ position: 1, createdAt: -1 }).maxTimeMS(5000),
    getAllMenuItems(restaurantId),
    WorkstationModel.find(wsQuery).sort({ position: 1 }),
  ]);
  return Promise.all(orders.map(order => inflateOrder(order.toObject(), menuItems, workstations)));
};

export const addOrder = async (orderData: Omit<Order, 'id' | 'createdAt'>) => {
  if (!orderData.restaurantId) {
    throw new Error('restaurantId is required when creating an order');
  }

  if (!orderData.items || orderData.items.length === 0) {
    throw new Error('Order must contain at least one item');
  }
  
  // Use timestamp-based ID for global uniqueness across restaurants
  const newId = Date.now();

  // Generate daily order number per restaurant using atomic counter (resets every day)
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const counter = await OrderCounterModel.findOneAndUpdate(
    { restaurantId: orderData.restaurantId, date: todayStr },
    { $inc: { lastOrderNumber: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  const newOrderNumber = counter.lastOrderNumber;

  // Ensure items have proper initial workstation assignment
  const workstations = await WorkstationModel.find({ restaurantId: orderData.restaurantId }).sort({ position: 1 });
  const firstWorkstation = workstations.length > 0 ? workstations[0] : null;
  
  // Process items to ensure they have workstationId and status
  const processedItems = (orderData.items || []).map(item => {
    // Ensure item has a workstationId (default to first workstation)
    const workstationId = item.workstationId || (firstWorkstation ? firstWorkstation.id : null);
    
    // Ensure item has a status (default to 'New')
    const status = item.status || 'New';
    
    return {
      ...item,
      workstationId,
      status
    };
  });

  const newOrder = new OrderModel({
    id: newId,
    createdAt: new Date(),
    ...orderData,
    orderNumber: newOrderNumber,
    items: processedItems
  });
  await newOrder.save();
  return newOrder.toObject();
};

export const updateOrderStatus = async (id: number, restaurantId: string, newStatus: string) => {
  const order = await OrderModel.findOne({ id, restaurantId });
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

export const deleteOrder = async (id: number, restaurantId: string) => {
  debugOrders('deleteOrder: called with id %d and restaurantId %s', id, restaurantId);

  try {
    // Initialize database connection
    await initializeDatabase();

    // First check if the order exists, scoped to the restaurant
    const query = { id, restaurantId };
    const orderExists = await OrderModel.findOne(query);
    debugOrders('deleteOrder: order exists check %O', orderExists);

    if (!orderExists) {
      debugOrders('deleteOrder: order with id %d not found', id);
      return false;
    }

    const result = await OrderModel.deleteOne(query);
    debugOrders('deleteOrder: deleteOne result %O', result);
    return result.deletedCount > 0;
  } catch (error) {
    debugOrders('deleteOrder: error %O', error);
    return false;
  }
};

export const updateOrder = async (id: number, restaurantId: string, orderData: Partial<Order>) => {
  const result = await OrderModel.updateOne(
    { id, restaurantId },
    { $set: orderData }
  );

  return result.modifiedCount > 0;
};

export const toggleOrderPin = async ({ orderId, restaurantId }: { orderId: number; restaurantId: string }) => {
  try {
    const order = await OrderModel.findOne({ id: orderId, restaurantId });
    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    order.isPinned = !order.isPinned;
    await order.save();

    return { success: true, isPinned: order.isPinned };
  } catch (error) {
    const err = error as { message?: string };
    console.error('Error toggling order pin:', error);
    return { success: false, error: err.message };
  }
};

export const updateOrderItemStatus = async ({
  orderId,
  restaurantId,
  itemId,
  status,
  moveToNextWorkstation = false,
  moveToPreviousWorkstation = false,
  nextWorkstationId,
  previousWorkstationId
}: {
  orderId: number;
  restaurantId: string;
  itemId: string;
  status: string;
  moveToNextWorkstation?: boolean;
  moveToPreviousWorkstation?: boolean;
  nextWorkstationId?: string;
  previousWorkstationId?: string;
}) => {
  try {
    await initializeDatabase();
    debugOrders('updateOrderItemStatus called with:', { orderId, restaurantId, itemId, status, moveToNextWorkstation, moveToPreviousWorkstation, nextWorkstationId, previousWorkstationId });
    
    const order = await OrderModel.findOne({ id: orderId, restaurantId });
    if (!order) {
      throw new Error('Order not found');
    }

    const itemIndex = order.items.findIndex((item: { id?: string }) => item.id === itemId);
    if (itemIndex === -1) {
      throw new Error('Item not found in order');
    }

    const currentItem = order.items[itemIndex];

    debugOrders('Current item state:', {
      orderId,
      itemId,
      currentStatus: currentItem.status,
      currentWorkstationId: currentItem.workstationId,
      newStatus: status,
      moveToNextWorkstation,
      moveToPreviousWorkstation,
      nextWorkstationId,
      previousWorkstationId
    });

    // Get all workstations to check if current workstation is Ready workstation
    const wsQuery = order.restaurantId ? { restaurantId: order.restaurantId } : {};
    const workstations = await WorkstationModel.find(wsQuery).sort({ position: 1 });
    // Find current workstation by id or _id
    const currentWsIndex = workstations.findIndex(ws => 
      ws.id === currentItem.workstationId || (ws._id && ws._id.toString() === currentItem.workstationId)
    );
    const isLastWorkstation = currentWsIndex === workstations.length - 1;
    const isReadyWorkstation = isLastWorkstation; // Last workstation is always the Ready workstation

    // Enforce that items in Ready workstation can only have Ready status
    // (Except when moving to previous workstation)
    if (isReadyWorkstation && status !== 'Ready' && !moveToPreviousWorkstation) {
      debugOrders('Attempt to set non-Ready status on item in Ready workstation rejected');
      throw new Error('Items in Ready workstation must have Ready status');
    }

    // Create update object preserving all required fields
    const updateFields: Record<string, unknown> = {
      'items.$.status': status,
      'items.$.name': currentItem.name || currentItem.menuItem?.name,
      'items.$.price': currentItem.price || currentItem.menuItem?.price,
      'items.$.menuItemId': currentItem.menuItemId || currentItem.menuItem?.id,
      'items.$.quantity': currentItem.quantity,
      'items.$.selectedExtras': currentItem.selectedExtras || [],
      'items.$.notes': currentItem.notes || ''
    };

    // If moving to next workstation, update the workstationId
    if (moveToNextWorkstation) {
      if (nextWorkstationId) {
        updateFields['items.$.workstationId'] = nextWorkstationId;
        debugOrders('Moving item to next workstation:', nextWorkstationId);
      } else {
        // If moveToNextWorkstation is true but nextWorkstationId is not provided,
        // try to determine the next workstation based on current one
        const currentWorkstationId = currentItem.workstationId;
        if (currentWorkstationId) {
          debugOrders('All workstations:', workstations.map(ws => ({ id: ws.id, name: ws.name, position: ws.position })));
          debugOrders('Current workstation ID:', currentWorkstationId);
          // Find current workstation by id or _id
          const currentIndex = workstations.findIndex(ws => 
            ws.id === currentWorkstationId || (ws._id && ws._id.toString() === currentWorkstationId)
          );
          debugOrders('Current index:', currentIndex);
          
          // Check if current workstation is the "Ready" workstation (last in workflow)
          // Only proceed if we found the current workstation
          if (currentIndex >= 0) {
            const isLastWorkstation = currentIndex === workstations.length - 1;
            
            if (!isLastWorkstation && currentIndex >= 0 && currentIndex < workstations.length - 1) {
              const nextWorkstation = workstations[currentIndex + 1];
              // Check if the next workstation has an id field
              if (nextWorkstation.id) {
                updateFields['items.$.workstationId'] = nextWorkstation.id;
                debugOrders('Moving item to next workstation:', nextWorkstation.id);
              } else {
                // If next workstation doesn't have an id, use its _id field
                updateFields['items.$.workstationId'] = nextWorkstation._id.toString();
                debugOrders('Moving item to next workstation (using _id):', nextWorkstation._id.toString());
              }
            } else if (isLastWorkstation) {
              // Actually last workstation: keep as Ready
              updateFields['items.$.status'] = 'Ready';
              moveToNextWorkstation = false; // No longer moving to next workstation
              debugOrders('Item at last workstation, keeping as Ready');
            } else {
              // Fallback - if we can't determine next steps, keep as Ready
              updateFields['items.$.status'] = 'Ready';
              moveToNextWorkstation = false; // No longer moving to next workstation
              debugOrders('Item at last workstation (fallback), keeping as Ready');
            }
          } else {
            // Could not find current workstation, assign to first workstation
            const firstWorkstation = workstations[0];
            if (firstWorkstation) {
              if (firstWorkstation.id) {
                updateFields['items.$.workstationId'] = firstWorkstation.id;
                debugOrders('Assigned item to first workstation:', firstWorkstation.id);
              } else {
                updateFields['items.$.workstationId'] = firstWorkstation._id.toString();
                debugOrders('Assigned item to first workstation (using _id):', firstWorkstation._id.toString());
              }
            }
          }
        } else {
          // Item has no workstation, assign to first workstation
          const firstWorkstations = workstations.slice(0, 1);
          if (firstWorkstations.length > 0) {
            updateFields['items.$.workstationId'] = firstWorkstations[0].id;
            debugOrders('Assigned item to first workstation:', firstWorkstations[0].id);
          }
        }
      }
    } else if (moveToPreviousWorkstation) {
      // Moving to previous workstation
      if (previousWorkstationId) {
        updateFields['items.$.workstationId'] = previousWorkstationId;
        debugOrders('Moving item to previous workstation:', previousWorkstationId);
      } else {
        // If moveToPreviousWorkstation is true but previousWorkstationId is not provided,
        // try to determine the previous workstation based on current one
        const currentWorkstationId = currentItem.workstationId;
        if (currentWorkstationId) {
          debugOrders('All workstations:', workstations.map(ws => ({ id: ws.id, name: ws.name, position: ws.position })));
          debugOrders('Current workstation ID:', currentWorkstationId);
          // Find current workstation by id or _id
          const currentIndex = workstations.findIndex(ws => 
            ws.id === currentWorkstationId || (ws._id && ws._id.toString() === currentWorkstationId)
          );
          debugOrders('Current index:', currentIndex);
          
          if (currentIndex > 0) {
            const previousWorkstation = workstations[currentIndex - 1];
            // Check if the previous workstation has an id field
            if (previousWorkstation.id) {
              updateFields['items.$.workstationId'] = previousWorkstation.id;
              debugOrders('Moving item to previous workstation:', previousWorkstation.id);
            } else {
              // If previous workstation doesn't have an id, use its _id field
              updateFields['items.$.workstationId'] = previousWorkstation._id.toString();
              debugOrders('Moving item to previous workstation (using _id):', previousWorkstation._id.toString());
            }
          } else {
            debugOrders('Item is already at first workstation, cannot move backward');
          }
        }
      }
    } else if (currentItem.workstationId && !moveToNextWorkstation && !moveToPreviousWorkstation) {
      // Ensure workstationId is preserved when not moving
      updateFields['items.$.workstationId'] = currentItem.workstationId;
      debugOrders('Preserving current workstation:', currentItem.workstationId);
      
      // Special case: If the item is in the Ready workstation, make sure its status is Ready
      if (isReadyWorkstation && status !== 'Ready') {
        updateFields['items.$.status'] = 'Ready';
        debugOrders('Item in Ready workstation, setting status to Ready');
      }
    } else if (!currentItem.workstationId) {
      // If item has no workstation, assign to first workstation
      const firstWorkstations = workstations.slice(0, 1);
      if (firstWorkstations.length > 0) {
        updateFields['items.$.workstationId'] = firstWorkstations[0].id;
        debugOrders('Assigned item to first workstation:', firstWorkstations[0].id);
      }
    }

    debugOrders('Update fields:', updateFields);

    // Update the specific item using positional operator, scoped to restaurant
    const updateResult = await OrderModel.updateOne(
      { id: orderId, restaurantId, 'items.id': itemId },
      { $set: updateFields }
    );
    
    debugOrders('Update result:', updateResult);

    // After updating, check if all items are served to mark order as completed
    const updatedOrder = await OrderModel.findOne({ id: orderId, restaurantId });
    if (updatedOrder) {
      const allItemsServed = updatedOrder.items.every((i: { status?: string }) => i.status === 'served');
      if (allItemsServed) {
        updatedOrder.status = 'completed';
        updatedOrder.completedAt = new Date();
        await updatedOrder.save();
        debugOrders('Order marked as completed since all items are served');
      }
    }

    debugOrders('Item status updated successfully');
    return true;
  } catch (error) {
    debugOrders('Error updating order item status:', error);
    throw error;
  }
};

// Payment Methods
export const getPaymentMethods = async (restaurantId?: string): Promise<Payment[]> => {
  await initializeDatabase();
  const query = restaurantId ? { restaurantId } : {};
  const paymentMethods = await PaymentModel.find(query).maxTimeMS(10000);
  return paymentMethods.map(method => method.toObject());
};

export const addPaymentMethod = async (methodData: Omit<Payment, 'id'>) => {
  try {
    if (!methodData.restaurantId) {
      throw new Error('restaurantId is required when creating a payment method');
    }
    
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

export const updatePaymentMethod = async (id: string, restaurantId: string, methodData: Partial<Payment>) => {
  try {
    // Ensure banks array is handled properly
    const updateData = { ...methodData };
    if (updateData.type && updateData.type !== 'bank_transfer') {
      // If type is not bank_transfer, ensure banks array is empty
      updateData.banks = [];
    }

    const result = await PaymentModel.updateOne(
      { id, restaurantId },
      { $set: updateData }
    );

    if (result.modifiedCount > 0) {
      // Return the updated payment method
      const updatedMethod = await PaymentModel.findOne({ id, restaurantId });
      return updatedMethod ? updatedMethod.toObject() : null;
    }

    return null;
  } catch (error) {
    console.error('Error updating payment method:', error);
    throw error;
  }
};

export const deletePaymentMethod = async (id: string, restaurantId: string) => {
  try {
    const result = await PaymentModel.deleteOne({ id, restaurantId });
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting payment method:', error);
    throw error;
  }
};



// Inventory
export const getInventory = async (restaurantId?: string): Promise<Inventory[]> => {
  debugInventory('getInventory: called with restaurantId %s', restaurantId || 'all');
  await initializeDatabase();
  const query = restaurantId ? { restaurantId } : {};
  const inventory = await InventoryModel.find(query).maxTimeMS(10000);
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
  if (!itemData.restaurantId) {
    throw new Error('restaurantId is required when creating an inventory item');
  }
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

export const updateInventoryItem = async (id: string, restaurantId: string, itemData: Partial<Inventory>) => {
  debugInventory('updateInventoryItem: called with id %s and data %O', id, itemData);
  const result = await InventoryModel.updateOne(
    { id, restaurantId },
    { $set: itemData }
  );
  debugInventory('updateInventoryItem: modified %d documents', result.modifiedCount);
  return result.modifiedCount > 0;
};

export const deleteInventoryItem = async (id: string, restaurantId: string) => {
  debugInventory('deleteInventoryItem: called with id %s', id);
  const result = await InventoryModel.deleteOne({ id, restaurantId });
  debugInventory('deleteInventoryItem: deleted %d documents', result.deletedCount);
  return result.deletedCount > 0;
};

export const updateInventoryStock = async (id: string, restaurantId: string, quantity: number) => {
  debugInventory('updateInventoryStock: called with id %s and quantity %d', id, quantity);
  const result = await InventoryModel.updateOne(
    { id, restaurantId },
    { $set: { quantity, lastRestocked: new Date() } }
  );
  debugInventory('updateInventoryStock: modified %d documents', result.modifiedCount);

  if (result.modifiedCount > 0) {
    // Return the updated inventory item
    const updatedItem = await InventoryModel.findOne({ id, restaurantId });
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
    return total + getItemTotal(item);
  }, 0);
};

export const getSalesReport = async (dateRange: DateRange, restaurantId?: string) => {
  const orders = await getInitialOrders(restaurantId);

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

export const getItemsReport = async (dateRange: DateRange, restaurantId?: string) => {
  const orders = await getInitialOrders(restaurantId);

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
      itemSales[itemId].total += getItemTotal(item);
    });
  });

  // Convert to array and sort by quantity
  const sortedItems = Object.values(itemSales).sort((a, b) => b.quantity - a.quantity);

  return {
    bestSelling: sortedItems.slice(0, 10),
    leastSelling: sortedItems.slice(-10).reverse()
  };
};

export const getKitchenReport = async (dateRange: DateRange, restaurantId?: string) => {
  const orders = await getInitialOrders(restaurantId);

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
  const itemsWithAvgTime = Object.entries(itemPrepTimes).map(([, data]) => ({
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
export const getWorkstations = async (restaurantId?: string): Promise<Workstation[]> => {
  await initializeDatabase();
  const query = restaurantId ? { restaurantId } : {};
  const workstations = await WorkstationModel.find(query).sort({ position: 1 }).maxTimeMS(10000);
  return workstations.map(workstation => workstation.toObject());
};

export const addWorkstation = async (workstationData: Omit<Workstation, 'id'>) => {
  if (!workstationData.restaurantId) {
    throw new Error('restaurantId is required when creating a workstation');
  }

  // Existing workstations sorted by position
  const existing = await getWorkstations(workstationData.restaurantId);

  // Insert the new workstation just before the last fixed workstation (e.g. Ready),
  // so the fixed endpoints always keep their place in the workflow.
  let insertIndex = existing.length;
  for (let i = existing.length - 1; i >= 0; i--) {
    if (existing[i].isFixed) {
      insertIndex = i;
      break;
    }
  }

  const newWorkstation = new WorkstationModel({
    id: generateId(),
    ...workstationData,
    isFixed: false,
    position: insertIndex
  });
  await newWorkstation.save();

  // Re-normalize positions so the new one sits before the last fixed workstation
  const ordered = [...existing.slice(0, insertIndex), newWorkstation, ...existing.slice(insertIndex)];
  const bulkOps = ordered.map((ws, i) => ({
    updateOne: {
      filter: { id: ws.id, restaurantId: workstationData.restaurantId },
      update: { $set: { position: i } }
    }
  }));
  await WorkstationModel.bulkWrite(bulkOps);

  // Return the newly created workstation plus the full reordered list so the
  // frontend can update atomically without a reload or a second fetch.
  const workstations = await getWorkstations(workstationData.restaurantId);
  return { workstation: newWorkstation.toObject(), workstations };
};

export const updateWorkstation = async (id: string, restaurantId: string, workstationData: Partial<Workstation>) => {
  // Protect the fixed flag and position from being modified through a generic update
  const safeData = Object.fromEntries(
    Object.entries(workstationData).filter(([key]) => key !== 'isFixed' && key !== 'position')
  );
  const result = await WorkstationModel.updateOne(
    { id, restaurantId },
    { $set: safeData }
  );

  return result.modifiedCount > 0;
};

export const deleteWorkstation = async (id: string, restaurantId: string) => {
  const existing = await WorkstationModel.findOne({ id, restaurantId });
  if (existing && existing.isFixed) {
    throw new Error('The first and last workstations are fixed and cannot be deleted');
  }
  const result = await WorkstationModel.deleteOne({ id, restaurantId });
  return result.deletedCount > 0;
};

export const updateWorkstationPositions = async (restaurantId: string, positions: { id: string; position: number }[]) => {
  try {
    const all = await WorkstationModel.find({ restaurantId }).sort({ position: 1 }).lean();
    const knownIds = new Set(all.map(w => w.id));

    // Identify the fixed first and fixed last workstations from the current order.
    // They must stay at the extremes regardless of the requested reorder.
    const fixed = all.filter(w => w.isFixed);
    const firstFixedId = fixed.length > 0 ? fixed[0].id : undefined;
    const lastFixedId = fixed.length > 1 ? fixed[fixed.length - 1].id : firstFixedId;

    const incomingIds = positions.map(p => p.id).filter(id => knownIds.has(id));

    let orderedIds: string[];
    if (firstFixedId) {
      if (firstFixedId === lastFixedId) {
        orderedIds = [firstFixedId, ...incomingIds.filter(id => id !== firstFixedId)];
      } else {
        orderedIds = [
          firstFixedId,
          ...incomingIds.filter(id => id !== firstFixedId && id !== lastFixedId),
          lastFixedId as string,
        ];
      }
    } else {
      orderedIds = incomingIds;
    }

    const bulkOps = orderedIds.map((id, i) => ({
      updateOne: {
        filter: { id, restaurantId },
        update: { $set: { position: i } }
      }
    }));

    await WorkstationModel.bulkWrite(bulkOps);

    const updatedWorkstations = await WorkstationModel.find({ id: { $in: orderedIds }, restaurantId }).sort({ position: 1 }).lean();
    return updatedWorkstations;
  } catch (error) {
    console.error('Error updating workstation positions:', error);
    throw error;
  }
};

// Add this new function for reordering orders
export const updateOrderPositions = async (orderId: number, newPosition: number, restaurantId: string) => {
  try {
    // First, get all orders for the restaurant sorted by their current positions
    const orders = await OrderModel.find({ restaurantId }).sort({ position: 1, createdAt: -1 }).maxTimeMS(5000); // Reduce timeout

    // Find the order we're moving
    const orderIndex = orders.findIndex(order => order.id === orderId);

    if (orderIndex === -1) {
      return { success: false, error: 'Order not found' };
    }

    // Remove the order from its current position
    const [movedOrder] = orders.splice(orderIndex, 1);

    // Insert it at the new position
    orders.splice(newPosition, 0, movedOrder);

    // Update all orders with their new positions
    const bulkOps = orders.map((order, index) => ({
      updateOne: {
        filter: { id: order.id },
        update: { $set: { position: index } }
      }
    }));

    if (bulkOps.length > 0) {
      await OrderModel.bulkWrite(bulkOps, { maxTimeMS: 5000 }); // Add timeout
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating order positions:', error);
    throw error;
  }
};

export const updateOrderItemPositions = async (orderId: number, restaurantId: string, itemPositions: { itemId: string; position: number }[]) => {
  try {
    // Get the order, scoped to the restaurant
    const order = await OrderModel.findOne({ id: orderId, restaurantId }).maxTimeMS(3000);
    
    if (!order) {
      return { success: false, error: 'Order not found' };
    }
    
    // Update item positions
    const updatedItems = order.items.map((item: { id?: string; position?: number }) => {
      const positionUpdate = itemPositions.find(p => p.itemId === item.id);
      if (positionUpdate) {
        return { ...item, position: positionUpdate.position };
      }
      return item;
    });
    
    // Update the order in the database
    await OrderModel.updateOne(
      { id: orderId, restaurantId },
      { $set: { items: updatedItems } }
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error updating order item positions:', error);
    throw error;
  }
};

export const swapOrderPositions = async (orderId1: number, orderId2: number, restaurantId: string) => {
  try {
    // Get the two orders we want to swap with timeout, scoped to restaurant
    const [order1, order2] = await Promise.all([
      OrderModel.findOne({ id: orderId1, restaurantId }).maxTimeMS(3000),
      OrderModel.findOne({ id: orderId2, restaurantId }).maxTimeMS(3000)
    ]);

    if (!order1 || !order2) {
      return { success: false, error: 'One or both orders not found' };
    }

    // Get their current positions
    const position1 = order1.position || 0;
    const position2 = order2.position || 0;

    // Swap their positions using bulk write for better performance
    await OrderModel.bulkWrite([
      {
        updateOne: {
          filter: { id: orderId1, restaurantId },
          update: { $set: { position: position2 } }
        }
      },
      {
        updateOne: {
          filter: { id: orderId2, restaurantId },
          update: { $set: { position: position1 } }
        }
      }
    ], { maxTimeMS: 5000 });

    return { success: true };
  } catch (error) {
    console.error('Error swapping order sizes positions:', error);
    throw error;
  }
};

// Tenant resolution helpers.
// These look up the owning restaurant from a resource's own record so that
// update/delete endpoints can stay scoped without trusting a client-supplied id.
export const resolveMenuItemRestaurantId = async (id: string): Promise<string | null> => {
  const doc = await MenuItemModel.findOne({ id }).select('restaurantId').lean();
  return (doc as { restaurantId?: string } | null)?.restaurantId ?? null;
};

export const resolveCustomerRestaurantId = async (id: string): Promise<string | null> => {
  const doc = await CustomerModel.findOne({ id }).select('restaurantId').lean();
  return (doc as { restaurantId?: string } | null)?.restaurantId ?? null;
};

export const resolvePaymentMethodRestaurantId = async (id: string): Promise<string | null> => {
  const doc = await PaymentModel.findOne({ id }).select('restaurantId').lean();
  return (doc as { restaurantId?: string } | null)?.restaurantId ?? null;
};

export const resolveInventoryItemRestaurantId = async (id: string): Promise<string | null> => {
  const doc = await InventoryModel.findOne({ id }).select('restaurantId').lean();
  return (doc as { restaurantId?: string } | null)?.restaurantId ?? null;
};

export const resolveWorkstationRestaurantId = async (id: string): Promise<string | null> => {
  const doc = await WorkstationModel.findOne({ id }).select('restaurantId').lean();
  return (doc as { restaurantId?: string } | null)?.restaurantId ?? null;
};

export const resolveUserRestaurantId = async (id: string): Promise<string | null> => {
  const doc = await UserModel.findOne({ id }).select('restaurantId').lean();
  return (doc as { restaurantId?: string } | null)?.restaurantId ?? null;
};

export const resolveOrderRestaurantId = async (id: number): Promise<string | null> => {
  const doc = await OrderModel.findOne({ id }).select('restaurantId').lean();
  return (doc as { restaurantId?: string } | null)?.restaurantId ?? null;
};
