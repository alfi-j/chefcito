
'use server'

import { type MenuItem, type Category, type Order, type OrderItem, type PaymentMethod, type Customer } from './types';
import { subDays, eachDayOfInterval, format, differenceInMinutes } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { readData, writeData } from './data-utils';

// Helper function to get all menu items for order inflation
const getAllMenuItems = async () => {
    return await readData<MenuItem[]>('menu-items.json');
}

const inflateOrder = async (order: any, allMenuItems: MenuItem[]): Promise<Order> => {
    const inflatedItems = await Promise.all(order.items.map(async (item: any) => {
        const menuItem = allMenuItems.find(mi => mi.id === item.menuItemId);
        if (!menuItem) {
            console.warn(`Menu item with ID ${item.menuItemId} not found for order ${order.id}`);
            return null; // or some default/error representation
        }
        
        const selectedExtras = await Promise.all((item.selectedExtraIds || []).map(async (extraId: string) => {
            const extraItem = allMenuItems.find(mi => mi.id === extraId);
            if(!extraItem) {
                console.warn(`Extra item with ID ${extraId} not found for order item ${item.id}`);
                return null;
            }
            return extraItem;
        }));

        return {
            ...item,
            menuItem,
            selectedExtras: selectedExtras.filter(e => e !== null) as MenuItem[],
        };
    }));

    return {
        ...order,
        items: inflatedItems.filter(i => i !== null) as OrderItem[],
    };
};


// Functions to interact with mock data

// Customers
export const getCustomers = async (): Promise<Customer[]> => {
    return await readData<Customer[]>('customers.json');
};

// Categories
export const getCategories = async (): Promise<Category[]> => {
    const categories = await readData<Category[]>('categories.json');
    return categories.sort((a, b) => a.name.localeCompare(b.name));
};

export const addCategory = async (categoryData: Omit<Category, 'id'>) => {
    const categories = await readData<Category[]>('categories.json');
    const newCategory: Category = { 
        id: categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1, 
        ...categoryData
    };
    categories.push(newCategory);
    await writeData('categories.json', categories);
    return newCategory;
};

export const updateCategory = async (updatedCategory: Category) => {
    const categories = await readData<Category[]>('categories.json');
    const index = categories.findIndex(c => c.id === updatedCategory.id);
    if (index > -1) {
        const oldName = categories[index].name;
        categories[index] = updatedCategory;
        
        // If category name changed, update menu items
        if (oldName !== updatedCategory.name) {
             const menuItems = await readData<MenuItem[]>('menu-items.json');
             menuItems.forEach(item => {
                if (item.category === oldName) {
                    item.category = updatedCategory.name;
                }
            });
            await writeData('menu-items.json', menuItems);
        }
        
        await writeData('categories.json', categories);
        return updatedCategory;
    }
    return null;
};

export const deleteCategory = async (id: number) => {
    let categories = await readData<Category[]>('categories.json');
    categories = categories.filter(c => c.id !== id);
    await writeData('categories.json', categories);
    return true;
};

export const isCategoryInUse = async (name: string) => {
    const menuItems = await readData<MenuItem[]>('menu-items.json');
    return menuItems.some(item => item.category === name);
}

// Menu Items
export const getMenuItems = async (): Promise<MenuItem[]> => {
    const items = await readData<MenuItem[]>('menu-items.json');
    return items.sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0));
};

export const addMenuItem = async (item: Omit<MenuItem, 'id' | 'sortIndex'>) => {
    const menuItems = await readData<MenuItem[]>('menu-items.json');
    const maxSortIndex = menuItems.length > 0 ? Math.max(...menuItems.map(i => i.sortIndex)) : -1;
    const newItem: MenuItem = { 
        id: String(Date.now()), 
        ...item, 
        sortIndex: maxSortIndex + 1 
    };
    menuItems.push(newItem);
    await writeData('menu-items.json', menuItems);
    return newItem;
};

export const updateMenuItem = async (item: MenuItem) => {
    const menuItems = await readData<MenuItem[]>('menu-items.json');
    const index = menuItems.findIndex(i => i.id === item.id);
    if (index > -1) {
        menuItems[index] = { ...menuItems[index], ...item };
        await writeData('menu-items.json', menuItems);
        return item;
    }
    return null;
};

export const updateMenuItemOrder = async (orderedIds: string[]) => {
    const menuItems = await readData<MenuItem[]>('menu-items.json');
    const itemMap = new Map(menuItems.map(item => [item.id, item]));
    const reorderedItems: MenuItem[] = [];

    orderedIds.forEach((id, index) => {
        const item = itemMap.get(id);
        if (item) {
            item.sortIndex = index;
            reorderedItems.push(item);
        }
    });

    // Add any items not in orderedIds back to the list
    menuItems.forEach(item => {
        if (!orderedIds.includes(item.id)) {
            reorderedItems.push(item);
        }
    });
    
    // Final sort to ensure consistency
    reorderedItems.sort((a,b) => a.sortIndex - b.sortIndex);
    
    await writeData('menu-items.json', reorderedItems);
    return true;
};

export const deleteMenuItem = async (id: string) => {
    let menuItems = await readData<MenuItem[]>('menu-items.json');
    menuItems = menuItems.filter(i => i.id !== id);
    await writeData('menu-items.json', menuItems);
    return true;
};

export const deleteMenuItems = async (ids: string[]) => {
    let menuItems = await readData<MenuItem[]>('menu-items.json');
    menuItems = menuItems.filter(i => !ids.includes(i.id));
    await writeData('menu-items.json', menuItems);
    return true;
};


// Orders
export const getInitialOrders = async (): Promise<Order[]> => {
    const ordersFromFile = await readData<any[]>('orders.json');
    const allMenuItems = await getAllMenuItems();
    const inflatedOrders = await Promise.all(ordersFromFile.map(order => inflateOrder(order, allMenuItems)));
    return inflatedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export const addOrder = async (orderData: { table: number, items: OrderItem[], customerId?: string }) => {
    const orders = await readData<any[]>('orders.json');
    const nextOrderId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;
    let nextItemIdCounter = Date.now();
    
    const newOrder = {
        id: nextOrderId,
        table: orderData.table,
        status: 'pending',
        createdAt: new Date().toISOString(),
        isPinned: false,
        customerId: orderData.customerId,
        items: orderData.items.map(item => ({
            id: String(nextItemIdCounter++),
            menuItemId: item.menuItem.id,
            quantity: item.quantity,
            cookedCount: 0,
            status: 'New',
            selectedExtraIds: item.selectedExtras?.map(e => e.id) || []
        }))
    };
    orders.push(newOrder);
    await writeData('orders.json', orders);
    return newOrder;
};

export const updateOrderItemStatus = async (payload: { itemId: string, newStatus: OrderItem['status'], newQuantity: number, newCookedCount: number }) => {
    const orders = await readData<any[]>('orders.json');
    let orderModified = false;
    for (const order of orders) {
        const item = order.items.find((i: any) => i.id === payload.itemId);
        if (item) {
            item.status = payload.newStatus;
            item.quantity = payload.newQuantity;
            item.cookedCount = payload.newCookedCount;
            // If the whole order is now cooked, mark it as completed
            if (order.items.every((i: any) => i.quantity === 0 && i.cookedCount > 0)) {
                 if (order.status === 'pending') {
                    order.status = 'completed';
                    order.completedAt = new Date().toISOString();
                 }
            }
            orderModified = true;
            break;
        }
    }
    if (orderModified) {
        await writeData('orders.json', orders);
    }
    return orderModified;
}

export const updateOrderStatus = async (payload: { orderId: number; newStatus: 'pending' | 'completed' }) => {
    const orders = await readData<any[]>('orders.json');
    const order = orders.find(o => o.id === payload.orderId);
    if (order) {
        order.status = payload.newStatus;
        if(payload.newStatus === 'completed' && !order.completedAt) {
            order.completedAt = new Date().toISOString();
        }
        await writeData('orders.json', orders);
        return true;
    }
    return false;
}

export const toggleOrderPin = async (payload: { orderId: number; isPinned: boolean }) => {
    const orders = await readData<any[]>('orders.json');
    const order = orders.find(o => o.id === payload.orderId);
    if (order) {
        order.isPinned = payload.isPinned;
        await writeData('orders.json', orders);
        return true;
    }
    return false;
}


// Payment Methods
export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
    return await readData<PaymentMethod[]>('payment-methods.json');
};

export const addPaymentMethod = async (method: Omit<PaymentMethod, 'id'>) => {
    const paymentMethods = await readData<PaymentMethod[]>('payment-methods.json');
    const newMethod: PaymentMethod = { id: `pm-${Date.now()}`, ...method };
    paymentMethods.push(newMethod);
    await writeData('payment-methods.json', paymentMethods);
    return newMethod;
};

export const updatePaymentMethod = async (method: PaymentMethod) => {
    const paymentMethods = await readData<PaymentMethod[]>('payment-methods.json');
    const index = paymentMethods.findIndex(i => i.id === method.id);
    if (index > -1) {
        paymentMethods[index] = method;
        await writeData('payment-methods.json', paymentMethods);
        return method;
    }
    return null;
};

export const deletePaymentMethod = async (id: string) => {
    let paymentMethods = await readData<PaymentMethod[]>('payment-methods.json');
    paymentMethods = paymentMethods.filter(i => i.id !== id);
    await writeData('payment-methods.json', paymentMethods);
    return true;
};


// Reporting
const getOrderTotal = (order: Order) => {
    return order.items.reduce((total, item) => {
        const extrasTotal = item.selectedExtras?.reduce((acc, extra) => acc + extra.price, 0) || 0;
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
            if (!itemSales[item.menuItem.id]) {
                itemSales[item.menuItem.id] = { name: item.menuItem.name, quantity: 0, total: 0 };
            }
            const quantity = item.cookedCount + item.quantity;
            itemSales[item.menuItem.id].quantity += quantity;
            itemSales[item.menuItem.id].total += item.menuItem.price * quantity;

            item.selectedExtras?.forEach(extra => {
                 if (!itemSales[extra.id]) {
                    itemSales[extra.id] = { name: extra.name, quantity: 0, total: 0 };
                }
                itemSales[extra.id].quantity += quantity;
                itemSales[extra.id].total += extra.price * quantity;
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
            if (!itemPrepTimes[item.menuItem.id]) {
                itemPrepTimes[item.menuItem.id] = { name: item.menuItem.name, times: [], count: 0 };
            }
            itemPrepTimes[item.menuItem.id].times.push(prepTime);
            itemPrepTimes[item.menuItem.id].count += (item.cookedCount + item.quantity);
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
