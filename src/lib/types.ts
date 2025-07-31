
export type Extra = {
  id: string;
  name: string;
  price: number;
};

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
  aiHint?: string;
  availableExtras?: Extra[];
};

export type OrderItem = {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  cookedCount: number;
  status: 'New' | 'Cooking' | 'Cooked';
  selectedExtras?: Extra[];
};

export type Order = {
  id: number;
  items: OrderItem[];
  status: 'pending' | 'completed';
  createdAt: Date;
  table: number;
  isPinned?: boolean;
};

export type Category = {
    id: number;
    name: string;
};

export const menuCategories = ['Appetizers', 'Main Courses', 'Desserts', 'Beverages'];
