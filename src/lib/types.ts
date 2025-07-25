
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
  cookedCount: number;
  status: 'New' | 'Cooking' | 'Cooked';
};

export type Order = {
  id: number;
  items: OrderItem[];
  status: 'pending' | 'completed';
  createdAt: Date;
  table: number;
  isPinned?: boolean;
};

export const menuCategories = ['Appetizers', 'Main Courses', 'Desserts', 'Beverages'];
