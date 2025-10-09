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
  quantity: number; // This will be the total quantity for the item line
  cookedCount: number;
  newCount: number;
  cookingCount: number;
  readyCount: number;
  servedCount: number; // For FOH to track
  selectedExtras?: MenuItem[];
  splitId?: number;
  notes?: string;
};

export type OrderStatusUpdate = {
  status: string;
  timestamp: string;
};

export type OrderType = 'dine-in' | 'delivery';

export type DeliveryInfo = {
  name: string;
  address: string;
  phone: string;
};

export type Order = {
  id: number;
  items: OrderItem[];
  status: 'pending' | 'completed';
  createdAt: Date;
  completedAt?: Date;
  table: number;
  isPinned?: boolean;
  customerId?: string;
  staffName?: string;
  statusHistory?: OrderStatusUpdate[];
  notes?: string;
  orderType: OrderType;
  deliveryInfo?: DeliveryInfo;
};

export type ModifierCategory = {
  id: number;
  name: string;
  parentId?: number | null;
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

export type Customer = {
  id: string;
  name: string;
  email: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: "kg" | "g" | "L" | "ml" | "pcs" | string;
  reorderThreshold: number;
  lastRestocked: string; // ISO date string
  linkedItemIds?: string[];
  category?: string;
};

export type Staff = {
  id: string;
  name: string;
  email: string;
  role: 'Staff' | 'Admin' | 'Restaurant Owner';
  status: 'On Shift' | 'Off Shift' | 'On Break';
  membership: 'free' | 'pro';
}

export type StaffPerformance = Staff & {
    tablesServed: number;
    totalSales: number;
    avgSaleValue: number;
};


export type ReadyItem = {
  id: string;
  name: string;
  orderId: number;
  table: number;
  orderItemId: string;
  selectedExtras?: MenuItem[];
  notes?: string;
}
