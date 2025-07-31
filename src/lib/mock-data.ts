
import { type MenuItem, type Category, type Order, type OrderItem, type PaymentMethod } from './types';

// Using let for mutable mock data
let menuItems: MenuItem[] = [
  { id: '1', name: 'Margherita Pizza', price: 12.99, category: 'Main Courses', imageUrl: 'https://placehold.co/300x200.png', aiHint: 'pizza food' },
  { id: '2', name: 'Caesar Salad', price: 8.99, category: 'Appetizers', imageUrl: 'https://placehold.co/300x200.png', aiHint: 'salad food' },
  { id: '3', name: 'Spaghetti Carbonara', price: 15.50, category: 'Main Courses', imageUrl: 'https://placehold.co/300x200.png', aiHint: 'pasta food' },
  { id: '4', name: 'Tiramisu', price: 6.50, category: 'Desserts', imageUrl: 'https://placehold.co/300x200.png', aiHint: 'tiramisu food' },
  { id: '5', name: 'Bruschetta', price: 7.00, category: 'Appetizers', imageUrl: 'https://placehold.co/300x200.png', aiHint: 'bruschetta food' },
  { id: '6', name: 'Coca-Cola', price: 2.50, category: 'Beverages', imageUrl: 'https://placehold.co/300x200.png', aiHint: 'soda drink' },
  { id: 'extra-1', name: 'Extra Cheese', price: 1.50, category: 'Extras', imageUrl: 'https://placehold.co/300x200.png', aiHint: 'cheese topping' },
  { id: 'extra-2', name: 'Bacon', price: 2.00, category: 'Extras', imageUrl: 'https://placehold.co/300x200.png', aiHint: 'bacon topping' },
  { id: 'extra-3', name: 'Avocado', price: 2.50, category: 'Extras', imageUrl: 'https://placehold.co/300x200.png', aiHint: 'avocado topping' },
  { id: 'extra-4', name: 'Extra Patty', price: 4.00, category: 'Extras', imageUrl: 'https://placehold.co/300x200.png', aiHint: 'burger meat' },
];

let categories: Category[] = [
  { id: 1, name: 'Appetizers' },
  { id: 2, name: 'Main Courses' },
  { id: 3, name: 'Desserts' },
  { id: 4, name: 'Beverages' },
  { id: 5, name: 'Extras', isExtra: true },
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
        isPinned: false,
        items: [
            { id: '3-1', menuItem: menuItems[3], quantity: 0, cookedCount: 1, status: 'Cooked' },
        ]
    },
];

let paymentMethods: PaymentMethod[] = [
    { id: 'pm-1', name: 'Cash', type: 'cash', enabled: true },
    { id: 'pm-2', name: 'Card', type: 'card', enabled: true },
    { id: 'pm-3', name: 'Bank Transfer', type: 'bank_transfer', enabled: true, banks: ['Bank A', 'Bank B', 'Bank C'] },
    { id: 'pm-4', name: 'Gift Card', type: 'card', enabled: false },
];


let nextOrderId = 4;
let nextItemId = 100;

// Functions to interact with mock data

// Categories
export const getCategories = () => [...categories].sort((a,b) => a.name.localeCompare(b.name));

export const addCategory = (name: string, isExtra?: boolean) => {
    const newCategory: Category = { id: categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1, name, isExtra };
    categories.push(newCategory);
    return newCategory;
};

export const updateCategory = (id: number, name: string, isExtra?: boolean) => {
    const category = categories.find(c => c.id === id);
    if (category) {
        const oldName = category.name;
        category.name = name;
        category.isExtra = isExtra;
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
export const getMenuItems = () => [...menuItems].sort((a, b) => a.name.localeCompare(b.name));

export const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = { id: String(Date.now()), ...item };
    menuItems.push(newItem);
    return newItem;
};

export const updateMenuItem = (item: MenuItem) => {
    const index = menuItems.findIndex(i => i.id === item.id);
    if (index > -1) {
        menuItems[index] = item;
        return item;
    }
    return null;
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

let lastNewOrderCheck = Date.now();
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
            return true;
        }
    }
    return false;
}

export const updateOrderStatus = (payload: { orderId: number; newStatus: 'pending' | 'completed' }) => {
    const order = orders.find(o => o.id === payload.orderId);
    if (order) {
        order.status = payload.newStatus;
        return true;
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
