
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
  selectedExtras?: MenuItem[];
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
    isExtra?: boolean;
};

export type PaymentMethod = {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'bank_transfer';
  enabled: boolean;
  banks?: string[];
};

export type BillSplit = {
  id: number;
  items: OrderItem[];
  total: number;
}

export const menuCategories = ['Appetizers', 'Main Courses', 'Desserts', 'Beverages'];

    