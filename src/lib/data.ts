export type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
  aiHint?: string;
};

export type OrderItem = {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  status: 'New' | 'Cooking' | 'Cooked';
};

export type Order = {
  id: number;
  items: OrderItem[];
  status: 'pending' | 'completed';
  createdAt: Date;
  table: number;
};

export const menuCategories = ['Appetizers', 'Main Courses', 'Desserts', 'Beverages'];

export const menuItems: MenuItem[] = [
  { id: '1', name: 'Bruschetta', price: 8.99, category: 'Appetizers', imageUrl: 'https://placehold.co/300x200.png', aiHint: 'bruschetta food' },
  { id: '2', name: 'Caprese Salad', price: 10.50, category: 'Appetizers', imageUrl: 'https://placehold.co/300x200.png', aiHint: 'caprese salad' },
  { id: '3', name: 'Spaghetti Carbonara', price: 15.99, category: 'Main Courses', imageUrl: 'https://placehold.co/300x200.png', aiHint: 'spaghetti carbonara' },
  { id: '4', name: 'Margherita Pizza', price: 14.50, category: 'Main Courses', imageUrl: 'https://placehold.co/300x200.png', aiHint: 'margherita pizza' },
  { id: '5', name: 'Grilled Salmon', price: 22.00, category: 'Main Courses', imageUrl: 'https://placehold.co/300x200.png', aiHint: 'grilled salmon' },
  { id: '6', name: 'Tiramisu', price: 7.50, category: 'Desserts', imageUrl: 'https://placehold.co/300x200.png', aiHint: 'tiramisu dessert' },
  { id: '7', name: 'Panna Cotta', price: 6.99, category: 'Desserts', imageUrl: 'https://placehold.co/300x200.png', aiHint: 'panna cotta' },
  { id: '8', name: 'Espresso', price: 3.00, category: 'Beverages', imageUrl: 'https://placehold.co/300x200.png', aiHint: 'espresso coffee' },
  { id: '9', name: 'Latte', price: 4.50, category: 'Beverages', imageUrl: 'https://placehold.co/300x200.png', aiHint: 'latte art' },
];

export const initialOrders: Order[] = [
    {
        id: 101,
        table: 5,
        status: 'pending',
        createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        items: [
            { id: '1-1', menuItem: menuItems[2], quantity: 1, status: 'New' },
            { id: '1-2', menuItem: menuItems[3], quantity: 1, status: 'New' },
        ]
    },
    {
        id: 102,
        table: 2,
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        items: [
            { id: '2-1', menuItem: menuItems[0], quantity: 2, status: 'Cooking' },
            { id: '2-2', menuItem: menuItems[4], quantity: 1, status: 'New' },
            { id: '2-3', menuItem: menuItems[8], quantity: 1, status: 'Cooked' },
        ]
    },
    {
        id: 103,
        table: 8,
        status: 'pending',
        createdAt: new Date(Date.now() - 22 * 60 * 1000), // 22 minutes ago, should be urgent
        items: [
            { id: '3-1', menuItem: menuItems[5], quantity: 1, status: 'New' },
            { id: '3-2', menuItem: menuItems[6], quantity: 1, status: 'New' },
            { id: '3-3', menuItem: menuItems[7], quantity: 2, status: 'Cooking' },
        ]
    },
    {
        id: 104,
        table: 12,
        status: 'pending',
        createdAt: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago
        items: [
            { id: '4-1', menuItem: menuItems[0], quantity: 1, status: 'New' },
            { id: '4-2', menuItem: menuItems[1], quantity: 1, status: 'New' },
            { id: '4-3', menuItem: menuItems[2], quantity: 1, status: 'Cooking' },
            { id: '4-4', menuItem: menuItems[3], quantity: 1, status: 'New' },
            { id: '4-5', menuItem: menuItems[4], quantity: 1, status: 'New' },
            { id: '4-6', menuItem: menuItems[5], quantity: 1, status: 'Cooked' },
            { id: '4-7', menuItem: menuItems[6], quantity: 1, status: 'New' },
            { id: '4-8', menuItem: menuItems[7], quantity: 2, status: 'Cooking' },
            { id: '4-9', menuItem: menuItems[8], quantity: 2, status: 'New' },
            { id: '4-10', menuItem: menuItems[3], quantity: 1, status: 'New' },
            { id: '4-11', menuItem: menuItems[1], quantity: 1, status: 'New' },
            { id: '4-12', menuItem: menuItems[0], quantity: 1, status: 'Cooked' },
        ]
    }
];
