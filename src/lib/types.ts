
export type MenuItem = {
  id: string;
  name: string;
  price: number;
  description?: string;
  available?: boolean;
  category: string;
  imageUrl: string;
  aiHint?: string;
  linkedModifiers?: string[]; // Names of modifier categories
  sortIndex: number;
};

export type OrderItem = {
  id:string;
  menuItem: MenuItem;
  quantity: number;
  cookedCount: number;
  status: 'New' | 'Cooking' | 'Cooked';
  selectedExtras?: MenuItem[];
  splitId?: number; // Add this to track which split the item belongs to
};

export type Order = {
  id: number;
  items: OrderItem[];
  status: 'pending' | 'completed';
  createdAt: Date;
  completedAt?: Date;
  table: number;
  isPinned?: boolean;
};

export type Category = {
    id: number;
    name: string;
    isModifierGroup?: boolean;
    linkedModifiers?: string[]; // Names of modifier categories
    parentId?: number | null;
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
  total: number;
}

export const menuCategories = ['Appetizers', 'Main Courses', 'Desserts', 'Beverages'];
