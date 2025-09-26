<<<<<<< HEAD
export interface MenuItem {
=======
export type MenuItem = {
>>>>>>> d3399ff (Chefcito Beta!)
  id: string;
  name: string;
  price: number;
  description?: string;
<<<<<<< HEAD
  available: boolean;
  category: string;
  imageUrl?: string;
  aiHint?: string;
  linkedModifiers?: string[];
  sortIndex: number;
}

export interface Category {
  id: number;
  name: string;
  isModifierGroup?: boolean;
  linkedModifiers?: string[];
  parentId?: number;
}

export interface OrderItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  newCount: number;
  cookingCount: number;
  readyCount: number;
  servedCount: number;
  selectedExtras?: MenuItem[];
  notes?: string;
}

export interface OrderStatusUpdate {
  orderId: number;
  itemId: string;
  newStatus: 'cooking' | 'ready' | 'served';
}

export type OrderType = 'dine-in' | 'delivery' | 'takeaway';

export interface DeliveryInfo {
  name: string;
  address: string;
  phone: string;
}

export interface Order {
  id: number;
  table: number;
  status: 'pending' | 'completed';
  createdAt: Date;
  completedAt?: Date;
  isPinned: boolean;
  customerId?: string;
  staffName?: string;
  statusHistory: { status: string; timestamp: string }[];
  notes?: string;
  orderType: OrderType;
  deliveryInfo?: DeliveryInfo;
  items: OrderItem[];
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'online';
  enabled: boolean;
  banks?: string[];
}

export interface BillSplit {
  id: number;
  orderId: number;
  items: { itemId: string; quantity: number }[];
  amount: number;
  paid: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  reorderThreshold: number;
  lastRestocked?: string;
  linkedItemIds?: string[];
  category?: string;
}

export interface Staff {
  id: string;
  name: string;
  email?: string;
  role: 'admin' | 'manager' | 'chef' | 'waiter' | 'cashier';
  status: 'active' | 'inactive';
}

export interface StaffPerformance {
  id: string;
  name: string;
  role: string;
  status: string;
  tablesServed: number;
  totalSales: number;
  avgSaleValue: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo?: string; // Staff ID
  reporterId?: string; // Staff ID
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  dueDate?: Date;
  completedAt?: Date;
=======
  available?: boolean;
  category: string;
  imageUrl: string;
  aiHint?: string;
  linkedModifiers?: string[]; // Names of modifier categories
  sortIndex?: number;
};

export type OrderItem = {
  id: string;
  menuItem: MenuItem;
  quantity: number; // This will be the total quantity for the item line
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
  unit: string; // e.g., 'kg', 'g', 'L', 'units'
  reorderThreshold: number;
  category: string;
  linkedItemIds: string[]; // IDs of menu items that use this ingredient
  lastRestocked?: string; // ISO date string
};

export type Staff = {
  id: string;
  name: string;
  email: string;
  role: 'Waiter' | 'Manager' | 'Chef';
  status: 'On Shift' | 'Off Shift' | 'On Break';
}

export type StaffPerformance = Staff & {
    tablesServed: number;
    totalSales: number;
    avgSaleValue: number;
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: 'To Do' | 'In Progress' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  assignedTo?: string; // Staff ID
  dueDate?: string; // ISO date string
>>>>>>> d3399ff (Chefcito Beta!)
}

