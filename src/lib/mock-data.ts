
import { type MenuItem, type Category, type Order, type OrderItem, type PaymentMethod } from './types';
import { subDays, eachDayOfInterval, format, differenceInMinutes, startOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';


// Using let for mutable mock data
let menuItems: MenuItem[] = [
  { id: '1', name: 'Margherita Pizza', price: 12.99, category: 'Pizzas', imageUrl: '', aiHint: 'pizza food', description: 'Classic pizza with fresh basil and mozzarella.', available: true, sortIndex: 0 },
  { id: '2', name: 'Caesar Salad', price: 8.99, category: 'Appetizers', imageUrl: '', aiHint: 'salad food', description: 'Crisp romaine lettuce with Caesar dressing, croutons, and Parmesan cheese.', available: true, sortIndex: 1 },
  { id: '3', name: 'Spaghetti Carbonara', price: 15.50, category: 'Pastas', imageUrl: '', aiHint: 'pasta food', description: 'Pasta with eggs, cheese, pancetta, and black pepper.', available: true, sortIndex: 2 },
  { id: '4', name: 'Tiramisu', price: 6.50, category: 'Desserts', imageUrl: '', aiHint: 'tiramisu food', description: 'Coffee-flavoured Italian dessert.', available: true, sortIndex: 3 },
  { id: '5', name: 'Bruschetta', price: 7.00, category: 'Appetizers', imageUrl: '', aiHint: 'bruschetta food', description: 'Grilled bread with garlic, topped with tomato and basil.', available: true, sortIndex: 4 },
  { id: '6', name: 'Coca-Cola', price: 2.50, category: 'Beverages', imageUrl: '', aiHint: 'soda drink', description: 'A classic refreshing soda.', available: true, sortIndex: 5 },
  { id: 'extra-1', name: 'Extra Cheese', price: 1.50, category: 'Extras', imageUrl: '', aiHint: 'cheese topping', description: 'Add extra cheese to your dish.', available: true, sortIndex: 6 },
  { id: 'extra-2', name: 'Bacon', price: 2.00, category: 'Extras', imageUrl: '', aiHint: 'bacon topping', description: 'Add crispy bacon.', available: true, sortIndex: 7 },
  { id: 'extra-3', name: 'Avocado', price: 2.50, category: 'Extras', imageUrl: '', aiHint: 'avocado topping', description: 'Add fresh avocado.', available: true, sortIndex: 8 },
  { id: 'extra-4', name: 'Extra Patty', price: 4.00, category: 'Extras', imageUrl: '', aiHint: 'burger meat', description: 'Add another juicy patty.', available: true, sortIndex: 9 },
];

let categories: Category[] = [
  { id: 1, name: 'Appetizers', parentId: null },
  { id: 2, name: 'Main Courses', linkedModifiers: ['Extras'], parentId: null },
  { id: 3, name: 'Desserts', parentId: null },
  { id: 4, name: 'Beverages', parentId: null },
  { id: 5, name: 'Extras', isModifierGroup: true, parentId: null },
  { id: 6, name: 'Pizzas', parentId: 2 },
  { id: 7, name: 'Pastas', parentId: 2 },
];

let orders: Order[] = [
    { 
        id: 1, 
        table: 3, 
        status: 'pending', 
        createdAt: new Date(Date.now() - 5 * 60 * 1000), 
        isPinned: false,
        items: [
            { id: '1-1', menuItem: menuItems[0], quantity: 1, cookedCount: 0, status: 'New', selectedExtras: [menuItems.find(m => m.id === 'extra-1')!] },
            { id: '1-2', menuItem: menuItems[2], quantity: 1, cookedCount: 0, status: 'New' },
        ]
    },
    { 
        id: 2, 
        table: 5, 
        status: 'pending', 
        createdAt: new Date(Date.now() - 15 * 60 * 1000), 
        isPinned: true,
        items: [
            { id: '2-1', menuItem: menuItems[1], quantity: 2, cookedCount: 0, status: 'New' },
            { id: '2-2', menuItem: menuItems[5], quantity: 2, cookedCount: 0, status: 'New' },
        ]
    },
     { 
        id: 3, 
        table: 1, 
        status: 'completed', 
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        completedAt: new Date(Date.now() - 20 * 60 * 1000),
        isPinned: false,
        items: [
            { id: '3-1', menuItem: menuItems[3], quantity: 0, cookedCount: 1, status: 'Cooked' },
        ]
    },
];

// Generate more historical completed orders for reporting
for (let i = 0; i < 50; i++) {
    const createdAt = subDays(new Date(), Math.floor(Math.random() * 30));
    const prepTime = Math.floor(Math.random() * 20) + 5; // 5 to 25 minutes
    const completedAt = new Date(createdAt.getTime() + prepTime * 60 * 1000);
    const numItems = Math.floor(Math.random() * 4) + 1;
    const orderItems: OrderItem[] = [];

    for (let j = 0; j < numItems; j++) {
        const menuItem = menuItems[Math.floor(Math.random() * menuItems.length)];
        const quantity = Math.floor(Math.random() * 2) + 1;
        orderItems.push({
            id: `h-${i}-${j}`,
            menuItem: menuItem,
            quantity: 0,
            cookedCount: quantity,
            status: 'Cooked'
        });
    }

    orders.push({
        id: 100 + i,
        table: Math.floor(Math.random() * 10) + 1,
        status: 'completed',
        createdAt,
        completedAt,
        items: orderItems,
    });
}


let paymentMethods: PaymentMethod[] = [
    { id: 'pm-1', name: 'Cash', type: 'cash', enabled: true },
    { id: 'pm-2', name: 'Card', type: 'card', enabled: true },
    { id: 'pm-3', name: 'Bank Transfer', type: 'bank_transfer', enabled: true, banks: ['Bank A', 'Bank B', 'Bank C'] },
    { id: 'pm-4', name: 'Gift Card', type: 'card', enabled: false },
];


let nextOrderId = orders.length + 1;
let nextItemId = 1000;

// Functions to interact with mock data

// Categories
export const getCategories = () => [...categories].sort((a,b) => a.name.localeCompare(b.name));

export const addCategory = (name: string, isModifierGroup?: boolean, parentId?: number | null) => {
    const newCategory: Category = { 
        id: categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1, 
        name, 
        isModifierGroup,
        parentId
    };
    categories.push(newCategory);
    return newCategory;
};

export const updateCategory = (id: number, name: string, isModifierGroup?: boolean, linkedModifiers?: string[], parentId?: number | null) => {
    const category = categories.find(c => c.id === id);
    if (category) {
        const oldName = category.name;
        category.name = name;
        category.isModifierGroup = isModifierGroup;
        category.linkedModifiers = linkedModifiers;
        category.parentId = parentId;
        // Also update menu items
        menuItems.forEach(item => {
            if (item.category === oldName) {
                item.category = name;
            }
        });
        return category;
    }
    return null;
};

export const deleteCategory = (id: number) => {
    const index = categories.findIndex(c => c.id === id);
    if (index > -1) {
        categories.splice(index, 1);
        return true;
    }
    return false;
};

export const isCategoryInUse = (name: string) => {
    return menuItems.some(item => item.category === name);
}

// Menu Items
export const getMenuItems = () => [...menuItems].sort((a, b) => a.sortIndex - b.sortIndex);

export const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const maxSortIndex = menuItems.length > 0 ? Math.max(...menuItems.map(i => i.sortIndex)) : -1;
    const newItem: MenuItem = { id: String(Date.now()), ...item, sortIndex: maxSortIndex + 1 };
    menuItems.push(newItem);
    return newItem;
};

export const updateMenuItem = (item: MenuItem) => {
    const index = menuItems.findIndex(i => i.id === item.id);
    if (index > -1) {
        menuItems[index] = { ...menuItems[index], ...item };
        return item;
    }
    return null;
};

export const updateMenuItemOrder = (orderedIds: string[]) => {
    const newMenuItems: MenuItem[] = [];
    const itemMap = new Map(menuItems.map(item => [item.id, item]));

    orderedIds.forEach((id, index) => {
        const item = itemMap.get(id);
        if (item) {
            item.sortIndex = index;
            newMenuItems.push(item);
        }
    });

    // Add any items not in orderedIds back to the list (though this shouldn't happen in a proper implementation)
    menuItems.forEach(item => {
        if (!orderedIds.includes(item.id)) {
            newMenuItems.push(item);
        }
    });

    menuItems = newMenuItems.sort((a,b) => a.sortIndex - b.sortIndex);
    return true;
};

export const deleteMenuItem = (id: string) => {
    const index = menuItems.findIndex(i => i.id === id);
    if (index > -1) {
        menuItems.splice(index, 1);
        return true;
    }
    return false;
};

export const findMenuItemById = (id: string) => menuItems.find(item => item.id === id);


// Orders
export const getInitialOrders = () => JSON.parse(JSON.stringify(orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())));

export const getNewOrders = () => {
    // Return empty array to stop new orders from being added
    return [];
}


export const addOrder = (orderData: { table: number, items: OrderItem[] }) => {
    const newOrder: Order = {
        id: nextOrderId++,
        table: orderData.table,
        status: 'pending',
        createdAt: new Date(),
        isPinned: false,
        items: orderData.items.map(item => ({...item, id: String(nextItemId++)}))
    };
    orders.push(newOrder);
    return newOrder;
};

export const updateOrderItemStatus = (payload: { itemId: string, newStatus: OrderItem['status'], newQuantity: number, newCookedCount: number }) => {
    for (const order of orders) {
        const item = order.items.find(i => i.id === payload.itemId);
        if (item) {
            item.status = payload.newStatus;
            item.quantity = payload.newQuantity;
            item.cookedCount = payload.newCookedCount;
            // If the whole order is now cooked, mark it as completed
            if (order.items.every(i => i.quantity === 0 && i.cookedCount > 0)) {
                 if (order.status === 'pending') {
                    order.status = 'completed';
                    order.completedAt = new Date();
                 }
            }
            return true;
        }
    }
    return false;
}

export const updateOrderStatus = (payload: { orderId: number; newStatus: 'pending' | 'completed' }) => {
    const order = orders.find(o => o.id === payload.orderId);
    if (order) {
        order.status = payload.newStatus;
        if(payload.newStatus === 'completed' && !order.completedAt) {
            order.completedAt = new Date();
        }
    }
    return false;
}

export const toggleOrderPin = (payload: { orderId: number; isPinned: boolean }) => {
    const order = orders.find(o => o.id === payload.orderId);
    if (order) {
        order.isPinned = payload.isPinned;
        return true;
    }
    return false;
}


// Payment Methods
export const getPaymentMethods = () => [...paymentMethods];

export const addPaymentMethod = (method: Omit<PaymentMethod, 'id'>) => {
    const newMethod: PaymentMethod = { id: `pm-${Date.now()}`, ...method };
    paymentMethods.push(newMethod);
    return newMethod;
};

export const updatePaymentMethod = (method: PaymentMethod) => {
    const index = paymentMethods.findIndex(i => i.id === method.id);
    if (index > -1) {
        paymentMethods[index] = method;
        return method;
    }
    return null;
};

export const deletePaymentMethod = (id: string) => {
    const index = paymentMethods.findIndex(i => i.id === id);
    if (index > -1) {
        paymentMethods.splice(index, 1);
        return true;
    }
    return false;
};


// Reporting
const getOrderTotal = (order: Order) => {
    return order.items.reduce((total, item) => {
        const extrasTotal = item.selectedExtras?.reduce((acc, extra) => acc + extra.price, 0) || 0;
        const mainItemPrice = item.menuItem.price + extrasTotal;
        return total + (mainItemPrice * (item.cookedCount + item.quantity));
    }, 0);
};

export const getSalesReport = (dateRange?: DateRange) => {
    const completedOrders = orders.filter(o => {
        if (o.status !== 'completed' || !o.completedAt) return false;
        if (!dateRange || !dateRange.from) return true;
        const to = dateRange.to || new Date();
        return o.completedAt >= dateRange.from && o.completedAt <= to;
    });

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
        const day = format(order.completedAt!, 'MMM d');
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

export const getItemSalesReport = (dateRange?: DateRange) => {
    const completedOrders = orders.filter(o => {
        if (o.status !== 'completed' || !o.completedAt) return false;
        if (!dateRange || !dateRange.from) return true;
        const to = dateRange.to || new Date();
        return o.completedAt >= dateRange.from && o.completedAt <= to;
    });

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

    const allItems = Object.values(itemSales).sort((a, b) => b.quantity - a.quantity);

    return {
        bestSelling: allItems.slice(0, 5),
        leastSelling: allItems.slice(-5).reverse(),
    };
};

export const getKitchenPerformanceReport = (dateRange?: DateRange) => {
    const completedOrders = orders.filter(o => {
        if (o.status !== 'completed' || !o.completedAt) return false;
        if (!dateRange || !dateRange.from) return true;
        const to = dateRange.to || new Date();
        return o.completedAt >= dateRange.from && o.completedAt <= to;
    });

    if (completedOrders.length === 0) {
        return { avgPrepTime: 0, mostDelayed: [] };
    }

    const prepTimes = completedOrders.map(o => differenceInMinutes(o.completedAt!, o.createdAt));
    const avgPrepTime = prepTimes.reduce((acc, time) => acc + time, 0) / prepTimes.length;

    const itemPrepTimes: { [key: string]: { name: string; times: number[]; count: number } } = {};
    completedOrders.forEach(order => {
        const prepTime = differenceInMinutes(order.completedAt!, o.createdAt);
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
