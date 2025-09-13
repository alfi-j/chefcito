export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
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
}

