import { 
  MenuItem, 
  Category, 
  Order, 
  OrderItem, 
  PaymentMethod, 
  Customer, 
  InventoryItem
} from './types';
import { DateRange } from 'react-day-picker';
import { 
  User as UserModel,
  Category as CategoryModel,
  MenuItem as MenuItemModel,
  Order as OrderModel,
  Inventory as InventoryModel,
  Customer as CustomerModel,
  PaymentMethod as PaymentMethodModel
} from '../models';
import { subDays, eachDayOfInterval, format, differenceInMinutes } from 'date-fns';

// Generate a random ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper function to get all menu items for order inflation
const getAllMenuItems = async () => {
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

    // Compatibility for new data structure
    const quantity = item.quantity || 0;
    const newCount = item.newCount ?? (item.status === 'New' ? quantity : 0);
    const cookingCount = item.cookingCount ?? (item.status === 'Cooking' ? quantity : 0);
    const readyCount = item.readyCount ?? (item.status === 'Ready' ? (item.cookedCount || 0) : 0);
    const totalQuantity = newCount + cookingCount + readyCount + (item.servedCount || 0) + (item.cookedCount || 0);

    return {
      ...item,
      menuItem,
      selectedExtras: selectedExtras.filter(e => e !== null) as MenuItem[],
      quantity: totalQuantity || quantity,
      newCount: newCount,
      cookingCount: cookingCount,
      readyCount: readyCount,
      servedCount: item.servedCount || 0,
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
  const users = await UserModel.find({});
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
  const customers = await CustomerModel.find({});
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
  const categories = await CategoryModel.find({});
  return categories.map(category => category.toObject());
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
  const menuItems = await MenuItemModel.find({});
  return menuItems.map(item => item.toObject());
};

export const addMenuItem = async (itemData: Omit<MenuItem, 'id'>) => {
  const newItem = new MenuItemModel({ 
    id: generateId(),
    ...itemData,
    sortIndex: 0 // Default sort index
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

export const deleteMenuItems = async (ids: string[]) => {
  // In a real implementation, we would do a bulk delete operation
  // For now, we'll just return true to indicate success
  return true;
};

// Orders
export const getInitialOrders = async (menuItems?: MenuItem[]): Promise<Order[]> => {
  const allMenuItems = menuItems || await getAllMenuItems();
  const orders = await OrderModel.find({});
  
  const inflatedOrders = await Promise.all(
    orders.map(order => inflateOrder(order.toObject(), allMenuItems))
  );
  
  return inflatedOrders;
};

export const addOrder = async (orderData: any) => {
  const newOrder = new OrderModel({
    id: Date.now(),
    ...orderData,
    createdAt: new Date(),
    status: 'pending',
    statusHistory: [{ status: 'pending', timestamp: new Date() }],
    staffName: '', // This would typically come from the authenticated user
  });
  
  await newOrder.save();
  return newOrder.toObject();
};

export const updateOrderItemStatus = async (payload: { 
  orderId: number; 
  itemId: string; 
  fromStatus?: 'New' | 'Cooking' | 'Serve';
  toStatus?: 'New' | 'Cooking' | 'Serve';
  updatedOrder: any;
}) => {
  const { orderId, updatedOrder } = payload;
  
  // Update the order with new item counts
  const result = await OrderModel.updateOne(
    { id: orderId },
    { $set: { items: updatedOrder.items } }
  );
  
  return result.modifiedCount > 0;
};

export const updateOrderStatus = async (payload: { orderId: number; newStatus: 'pending' | 'completed' }) => {
  const order = await OrderModel.findOne({ id: payload.orderId });
  
  if (order) {
    order.status = payload.newStatus;
    const now = new Date();
    
    if(payload.newStatus === 'completed' && !order.completedAt) {
      order.completedAt = now;
    } else if (payload.newStatus === 'pending') {
      // Remove completedAt timestamp if reverted
      order.completedAt = undefined;
    }
    
    if (!order.statusHistory) {
      order.statusHistory = [];
    }
    
    order.statusHistory.push({ status: payload.newStatus, timestamp: now });
    
    await order.save();
    return true;
  }
  return false;
};

export const toggleOrderPin = async (payload: { orderId: number; isPinned: boolean }) => {
  const result = await OrderModel.updateOne(
    { id: payload.orderId },
    { $set: { isPinned: payload.isPinned } }
  );
  
  return result.modifiedCount > 0;
};

// Payment Methods
export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const paymentMethods = await PaymentMethodModel.find({});
  return paymentMethods.map(method => method.toObject());
};

export const addPaymentMethod = async (methodData: Omit<PaymentMethod, 'id'>) => {
  const newMethod = new PaymentMethodModel({ 
    id: generateId(),
    ...methodData
  });
  await newMethod.save();
  return newMethod.toObject();
};

export const updatePaymentMethod = async (id: string, methodData: Partial<PaymentMethod>) => {
  const result = await PaymentMethodModel.updateOne(
    { id },
    { $set: methodData }
  );
  
  return result.modifiedCount > 0;
};

export const deletePaymentMethod = async (id: string) => {
  const result = await PaymentMethodModel.deleteOne({ id });
  return result.deletedCount > 0;
};

// Inventory
export const getInventory = async (): Promise<InventoryItem[]> => {
  const inventory = await InventoryModel.find({});
  return inventory.map(item => {
    const itemObj = item.toObject();
    // Convert Date to string for lastRestocked
    return {
      ...itemObj,
      lastRestocked: itemObj.lastRestocked.toISOString()
    };
  });
};

export const addInventoryItem = async (itemData: Omit<InventoryItem, 'id'>) => {
  const newItem = new InventoryModel({ 
    id: generateId(),
    ...itemData,
    lastRestocked: new Date()
  });
  await newItem.save();
  const savedItem = newItem.toObject();
  return {
    ...savedItem,
    lastRestocked: savedItem.lastRestocked.toISOString()
  };
};

export const updateInventoryItem = async (id: string, itemData: Partial<InventoryItem>) => {
  const result = await InventoryModel.updateOne(
    { id },
    { $set: itemData }
  );
  
  return result.modifiedCount > 0;
};

export const deleteInventoryItem = async (id: string) => {
  const result = await InventoryModel.deleteOne({ id });
  return result.deletedCount > 0;
};

export const updateInventoryStock = async (id: string, quantity: number) => {
  const result = await InventoryModel.updateOne(
    { id },
    { $set: { quantity, lastRestocked: new Date() } }
  );
  
  return result.modifiedCount > 0;
};


// Reporting
const getOrderTotal = (order: Order): number => {
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
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + getOrderTotal(order), 0);
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
    
    const dayRevenue = dayOrders.reduce((sum, order) => sum + getOrderTotal(order), 0);
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
  
  // Convert to array and sort
  const itemsArray = Object.values(itemSales);
  const bestSelling = [...itemsArray].sort((a, b) => b.quantity - a.quantity);
  const leastSelling = [...itemsArray].sort((a, b) => a.quantity - b.quantity);
  
  return {
    bestSelling,
    leastSelling
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
  let completedItems = 0;
  
  filteredOrders.forEach(order => {
    if (order.statusHistory) {
      // Find when the order was created and when it was completed
      const createdEvent = order.statusHistory.find(event => event.status === 'pending');
      const completedEvent = order.statusHistory.find(event => event.status === 'completed');
      
      if (createdEvent && completedEvent) {
        const createdTime = new Date(createdEvent.timestamp);
        const completedTime = new Date(completedEvent.timestamp);
        const prepTime = differenceInMinutes(completedTime, createdTime);
        
        if (prepTime > 0) {
          totalPrepTime += prepTime;
          completedItems += order.items.length;
        }
      }
    }
  });
  
  const avgPrepTime = completedItems > 0 ? totalPrepTime / completedItems : 0;
  
  // Find most delayed items (simplified)
  const itemDelays: Record<string, { name: string; totalTime: number; count: number }> = {};
  
  filteredOrders.forEach(order => {
    if (order.statusHistory) {
      const createdEvent = order.statusHistory.find(event => event.status === 'pending');
      const completedEvent = order.statusHistory.find(event => event.status === 'completed');
      
      if (createdEvent && completedEvent) {
        const createdTime = new Date(createdEvent.timestamp);
        const completedTime = new Date(completedEvent.timestamp);
        const prepTime = differenceInMinutes(completedTime, createdTime);
        
        if (prepTime > 0) {
          order.items.forEach(item => {
            const itemId = item.menuItem.id;
            if (!itemDelays[itemId]) {
              itemDelays[itemId] = {
                name: item.menuItem.name,
                totalTime: 0,
                count: 0
              };
            }
            
            itemDelays[itemId].totalTime += prepTime;
            itemDelays[itemId].count += 1;
          });
        }
      }
    }
  });
  
  // Calculate average delay per item
  const delayedItems = Object.values(itemDelays)
    .map(item => ({
      name: item.name,
      avgTime: item.count > 0 ? item.totalTime / item.count : 0
    }))
    .sort((a, b) => b.avgTime - a.avgTime)
    .slice(0, 10); // Top 10 most delayed items
  
  return {
    avgPrepTime,
    mostDelayed: delayedItems
  };
};