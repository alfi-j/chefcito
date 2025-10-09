import { 
  MenuItem, 
  Category, 
  Order, 
  OrderItem, 
  PaymentMethod, 
  Customer, 
  InventoryItem, 
  Staff, 
  StaffPerformance
} from './types';
import { DateRange } from 'react-day-picker';
import { 
  findMany as findManyTyped, 
  findOne as findOneTyped, 
  insertOne as insertOneTyped, 
  updateOne as updateOneTyped, 
  updateMany as updateManyTyped,
  deleteOne as deleteOneTyped,
  insertMany as insertManyTyped
} from './mongodb';
import { subDays, eachDayOfInterval, format, differenceInMinutes } from 'date-fns';

// Generate a random ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper function to get all menu items for order inflation
const getAllMenuItems = async () => {
  return await findManyTyped<MenuItem>('menuItems');
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

// Staff
export const getStaff = async (): Promise<Staff[]> => {
  return await findManyTyped<Staff>('staff');
};

export const getStaffPerformance = async (dateRange?: DateRange): Promise<StaffPerformance[]> => {
  const staffList = await getStaff();
  const orders = await getInitialOrders();
  
  const completedOrders = orders.filter(o => {
    if (o.status !== 'completed' || !o.completedAt) return false;
    if (!dateRange || !dateRange.from) return true;
    const completedAt = new Date(o.completedAt);
    const to = dateRange.to || new Date();
    return completedAt >= dateRange.from && completedAt <= to;
  });

  const performanceData: StaffPerformance[] = staffList.map(staff => {
    const staffOrders = completedOrders.filter(o => o.staffName === staff.name);
    const totalSales = staffOrders.reduce((acc, order) => acc + getOrderTotal(order), 0);
    const tablesServed = new Set(staffOrders.map(o => o.table)).size;
    const avgSaleValue = staffOrders.length > 0 ? totalSales / staffOrders.length : 0;

    return {
      ...staff,
      tablesServed,
      totalSales,
      avgSaleValue,
    };
  });

  return performanceData;
};

// Customers
export const getCustomers = async (): Promise<Customer[]> => {
  return await findManyTyped<Customer>('customers');
};

// Categories
export const getCategories = async (): Promise<Category[]> => {
  const categories = await findManyTyped<Category>('categories');
  return categories.sort((a, b) => a.name.localeCompare(b.name));
};

export const addCategory = async (categoryData: Omit<Category, 'id'>) => {
  const categories = await findManyTyped<Category>('categories');
  const newCategory = { 
    id: categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1, 
    ...categoryData
  };
  await insertOneTyped('categories', newCategory);
  return newCategory;
};

export const updateCategory = async (updatedCategory: Category) => {
  const result = await updateOneTyped(
    'categories',
    { id: updatedCategory.id },
    { $set: updatedCategory }
  );
  
  if (result.modifiedCount > 0) {
    // If category name changed, update menu items
    const categories = await findManyTyped<Category>('categories');
    const oldCategory = categories.find(c => c.id === updatedCategory.id);
    
    if (oldCategory && oldCategory.name !== updatedCategory.name) {
      await updateManyTyped(
        'menuItems',
        { category: oldCategory.name },
        { $set: { category: updatedCategory.name } }
      );
    }
    
    return updatedCategory;
  }
  return null;
};

export const deleteCategory = async (id: number) => {
  const result = await deleteOneTyped('categories', { id });
  return result.deletedCount > 0;
};

export const isCategoryInUse = async (name: string) => {
  const count = await (await findManyTyped<MenuItem>('menuItems')).filter(item => item.category === name).length;
  return count > 0;
};

// Menu Items
export const getMenuItems = async (): Promise<MenuItem[]> => {
  const items = await findManyTyped<MenuItem>('menuItems');
  return items
    .map(item => ({
      ...item,
      sortIndex: item.sortIndex ?? 0
    }))
    .sort((a, b) => a.sortIndex - b.sortIndex);
};

export const addMenuItem = async (itemData: Omit<MenuItem, 'id' | 'sortIndex'>) => {
  const menuItems = await findManyTyped<MenuItem>('menuItems');
  const newItem = { 
    id: generateId(),
    sortIndex: menuItems.length,
    ...itemData
  };
  await insertOneTyped('menuItems', newItem);
  return newItem;
};

export const updateMenuItem = async (item: MenuItem) => {
  const result = await updateOneTyped(
    'menuItems',
    { id: item.id },
    { $set: item }
  );
  
  if (result.modifiedCount > 0) {
    return item;
  }
  return null;
};

export const updateMenuItemOrder = async (orderedIds: string[]) => {
  const menuItems = await findManyTyped<MenuItem>('menuItems');
  const itemMap = new Map(menuItems.map(item => [item.id, item]));

  for (let i = 0; i < orderedIds.length; i++) {
    const id = orderedIds[i];
    const item = itemMap.get(id);
    if (item) {
      item.sortIndex = i;
      await updateOneTyped(
        'menuItems',
        { id: item.id },
        { $set: { sortIndex: i } }
      );
    }
  }
  
  return true;
};

export const deleteMenuItem = async (id: string) => {
  const result = await deleteOneTyped('menuItems', { id });
  return result.deletedCount > 0;
};

export const deleteMenuItems = async (ids: string[]) => {
  // In a real implementation, we would do a bulk delete operation
  // For now, we'll just return true to indicate success
  return true;
};

// Orders
export const getInitialOrders = async (menuItems?: MenuItem[]): Promise<Order[]> => {
  const ordersFromFile = await findManyTyped<any>('orders');
  const allMenuItems = menuItems || await getAllMenuItems();
  const inflatedOrders = await Promise.all(ordersFromFile.map(order => inflateOrder(order, allMenuItems)));
  return inflatedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const addOrder = async (orderData: { 
  table: number, 
  items: OrderItem[], 
  notes?: string,
  orderType: any,
  deliveryInfo?: any,
}) => {
  const orders = await findManyTyped<any>('orders');
  const newOrder: any = {
    id: orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1,
    table: orderData.table,
    status: 'pending',
    createdAt: new Date().toISOString(),
    isPinned: false,
    notes: orderData.notes || '',
    orderType: orderData.orderType || 'dine-in',
    deliveryInfo: orderData.orderType === 'delivery' ? orderData.deliveryInfo : null,
    staffName: '', // This would typically come from the authenticated user
    statusHistory: [{
      status: 'pending',
      timestamp: new Date().toISOString()
    }],
    items: orderData.items.map((item: any) => ({
      ...item,
      id: generateId()
    }))
  };
  
  await insertOneTyped('orders', newOrder);
  return newOrder;
};

export const updateOrderItemStatus = async (orderId: number, itemId: string, newStatus: 'New' | 'Cooking' | 'Ready') => {
  // Get the order
  const orders = await findManyTyped<any>('orders');
  const order = orders.find((o: any) => o.id === orderId);
  
  if (!order) return false;
  
  // Find the item and update its status
  const item = order.items.find((i: any) => i.id === itemId);
  if (!item) return false;
  
  // Update the item status counts
  switch (newStatus) {
    case 'New':
      item.newCount = item.quantity;
      item.cookingCount = 0;
      item.readyCount = 0;
      break;
    case 'Cooking':
      item.newCount = 0;
      item.cookingCount = item.quantity;
      item.readyCount = 0;
      break;
    case 'Ready':
      item.newCount = 0;
      item.cookingCount = 0;
      item.readyCount = item.quantity;
      break;
  }
  
  // Update the order in the database
  const result = await updateOneTyped(
    'orders',
    { id: orderId },
    { $set: { items: order.items } }
  );
  
  return result.modifiedCount > 0;
};

export const updateOrderStatus = async (payload: { orderId: number; newStatus: 'pending' | 'completed' }) => {
  const orders = await findManyTyped<any>('orders');
  const order = orders.find((o: any) => o.id === payload.orderId);
  
  if (order) {
    order.status = payload.newStatus;
    const now = new Date().toISOString();
    
    if(payload.newStatus === 'completed' && !order.completedAt) {
      order.completedAt = now;
    } else if (payload.newStatus === 'pending') {
      // Remove completedAt timestamp if reverted
      delete order.completedAt;
    }
    
    order.statusHistory.push({ status: payload.newStatus, timestamp: now });
    
    const result = await updateOneTyped<Order>(
      'orders',
      { id: payload.orderId },
      { $set: order }
    );
    
    return result.modifiedCount > 0;
  }
  return false;
};

export const toggleOrderPin = async (payload: { orderId: number; isPinned: boolean }) => {
  const result = await updateOneTyped(
    'orders',
    { id: payload.orderId },
    { $set: { isPinned: payload.isPinned } }
  );
  
  return result.modifiedCount > 0;
};

// Payment Methods
export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  return await findManyTyped<PaymentMethod>('paymentMethods');
};

export const addPaymentMethod = async (methodData: Omit<PaymentMethod, 'id'>) => {
  const newMethod = { 
    id: generateId(),
    ...methodData
  };
  await insertOneTyped('paymentMethods', newMethod);
  return newMethod;
};

export const updatePaymentMethod = async (method: PaymentMethod) => {
  const result = await updateOneTyped(
    'paymentMethods',
    { id: method.id },
    { $set: method }
  );
  
  if (result.modifiedCount > 0) {
    return method;
  }
  return null;
};

export const deletePaymentMethod = async (id: string) => {
  const result = await deleteOneTyped('paymentMethods', { id });
  return result.deletedCount > 0;
};

// Inventory
export const getInventoryItems = async (): Promise<InventoryItem[]> => {
  return await findManyTyped<InventoryItem>('inventory');
};

export const addInventoryItem = async (itemData: Omit<InventoryItem, 'id' | 'lastRestocked'>) => {
  const newItem = { 
    id: generateId(),
    lastRestocked: new Date().toISOString(),
    ...itemData
  };
  await insertOneTyped('inventory', newItem);
  return newItem;
};

export const updateInventoryItem = async (item: InventoryItem) => {
  const result = await updateOneTyped(
    'inventory',
    { id: item.id },
    { $set: item }
  );
  
  if (result.modifiedCount > 0) {
    return item;
  }
  return null;
};

export const deleteInventoryItem = async (id: string) => {
  const result = await deleteOneTyped('inventory', { id });
  return result.deletedCount > 0;
}

export const adjustInventoryStock = async (itemId: string, adjustment: number) => {
  const inventory = await findManyTyped<InventoryItem>('inventory');
  const item = inventory.find(i => i.id === itemId);
  
  if (item) {
    item.quantity = Math.max(0, item.quantity + adjustment);
    if (adjustment > 0) {
      item.lastRestocked = new Date().toISOString();
    }
    
    const result = await updateOneTyped<InventoryItem>(
      'inventory',
      { id: itemId },
      { $set: item }
    );
    
    if (result.modifiedCount > 0) {
      return item;
    }
  }
  return null;
}


// Reporting
const getOrderTotal = (order: Order) => {
  return order.items.reduce((total, item) => {
    const extrasTotal = item.selectedExtras?.reduce((acc, extra) => acc + extra.price, 0) || 0;
    const totalUnits = (item.cookedCount || 0) + (item.quantity || 0);
    const mainItemPrice = item.menuItem.price + extrasTotal;
    return total + (mainItemPrice * (item.cookedCount + item.quantity));
  }, 0);
};

export const getSalesReport = async (dateRange?: DateRange) => {
  const orders = await getInitialOrders();
  const completedOrders = orders.filter(o => {
    if (o.status !== 'completed' || !o.completedAt) return false;
    if (!dateRange || !dateRange.from) return true;
    const completedAt = new Date(o.completedAt);
    const to = dateRange.to || new Date();
    return completedAt >= dateRange.from && completedAt <= to;
  });

  if (completedOrders.length === 0) return null;

  const totalRevenue = completedOrders.reduce((acc, order) => acc + getOrderTotal(order), 0);
  const totalOrders = completedOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const dailySales: { [key: string]: number } = {};
  if (dateRange?.from) {
    const interval = eachDayOfInterval({ start: dateRange.from, end: dateRange.to || dateRange.from });
    interval.forEach(day => {
      const formattedDay = format(day, 'MMM d');
      dailySales[formattedDay] = 0;
    });
  }

  completedOrders.forEach(order => {
    if(!order.completedAt) return;
    const day = format(new Date(order.completedAt), 'MMM d');
    if (dailySales[day] !== undefined) {
      dailySales[day] += getOrderTotal(order);
    }
  });

  return {
    totalRevenue,
    totalOrders,
    avgOrderValue,
    dailySales: Object.entries(dailySales).map(([date, total]) => ({ date, total })),
  };
};

export const getItemSalesReport = async (dateRange?: DateRange) => {
  const orders = await getInitialOrders();
  const completedOrders = orders.filter(o => {
    if (o.status !== 'completed' || !o.completedAt) return false;
    if (!dateRange || !dateRange.from) return true;
    const completedAt = new Date(o.completedAt);
    const to = dateRange.to || new Date();
    return completedAt >= dateRange.from && completedAt <= to;
  });

  if (completedOrders.length === 0) return null;

  const itemSales: { [key: string]: { name: string, quantity: number, total: number } } = {};

  completedOrders.forEach(order => {
    order.items.forEach(item => {
      const totalUnits = item.quantity;

      if (!itemSales[item.menuItem.id]) {
        itemSales[item.menuItem.id] = { name: item.menuItem.name, quantity: 0, total: 0 };
      }
      itemSales[item.menuItem.id].quantity += totalUnits;
      itemSales[item.menuItem.id].total += item.menuItem.price * totalUnits;

      item.selectedExtras?.forEach(extra => {
         if (!itemSales[extra.id]) {
            itemSales[extra.id] = { name: extra.name, quantity: 0, total: 0 };
        }
        itemSales[extra.id].quantity += totalUnits;
        itemSales[extra.id].total += extra.price * totalUnits;
      });
    });
  });
  
  if (Object.keys(itemSales).length === 0) return null;

  const allItems = Object.values(itemSales).sort((a, b) => b.quantity - a.quantity);

  return {
    bestSelling: allItems.slice(0, 5),
    leastSelling: allItems.slice(-5).reverse(),
  };
};

export const getKitchenPerformanceReport = async (dateRange?: DateRange) => {
  const orders = await getInitialOrders();
  const completedOrders = orders.filter(o => {
    if (o.status !== 'completed' || !o.completedAt) return false;
    if (!dateRange || !dateRange.from) return true;
    const completedAt = new Date(o.completedAt);
    const to = dateRange.to || new Date();
    return completedAt >= dateRange.from && completedAt <= to;
  });

  const validOrders = completedOrders.filter(o => o.completedAt);
  if (validOrders.length === 0) {
    return null;
  }

  const prepTimes = validOrders.map(o => differenceInMinutes(new Date(o.completedAt!), new Date(o.createdAt)));
  const avgPrepTime = prepTimes.reduce((acc, time) => acc + time, 0) / prepTimes.length;

  const itemPrepTimes: { [key: string]: { name: string; times: number[]; count: number } } = {};
  validOrders.forEach(order => {
    const prepTime = differenceInMinutes(new Date(order.completedAt!), new Date(order.createdAt));
    order.items.forEach(item => {
      const totalUnits = item.quantity;
      if (!itemPrepTimes[item.menuItem.id]) {
        itemPrepTimes[item.menuItem.id] = { name: item.menuItem.name, times: [], count: 0 };
      }
      itemPrepTimes[item.menuItem.id].times.push( prepTime );
      itemPrepTimes[item.menuItem.id].count += totalUnits;
    });
  });

  const mostDelayed = Object.values(itemPrepTimes)
    .map(item => ({
      name: item.name,
      avgTime: item.times.reduce((a, b) => a + b, 0) / item.times.length,
    }))
    .sort((a, b) => b.avgTime - a.avgTime)
    .slice(0, 5);

  return { avgPrepTime, mostDelayed };
};