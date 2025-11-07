import { create } from 'zustand';
import { useMemo } from 'react';
import { type OrderItem, type MenuItem, type OrderType, type DeliveryInfo } from '@/lib/types';
import { KDS_STATES } from '@/lib/kds-constants';

interface CurrentOrderState {
  items: OrderItem[];
  table: number;
  notes: string;
  orderType: OrderType;
  deliveryInfo: DeliveryInfo;
  
  // Actions
  setItems: (items: OrderItem[]) => void;
  setTable: (table: number) => void;
  setNotes: (notes: string) => void;
  setOrderType: (orderType: OrderType) => void;
  setDeliveryInfo: (deliveryInfo: DeliveryInfo) => void;
  
  addItem: (itemToAdd: MenuItem, quantity: number, selectedExtras: MenuItem[], notes?: string) => void;
  updateItem: (itemId: string, newQuantity: number, newSelectedExtras: MenuItem[], notes?: string) => void;
  updateItemQuantity: (itemId: string, adjustment: number) => void;
  removeItem: (itemId: string) => void;
  clearOrder: () => void;
}

export const useCurrentOrderStore = create<CurrentOrderState>()((set, get) => ({
  items: [],
  table: 1,
  notes: '',
  orderType: 'dine-in',
  deliveryInfo: {
    name: '',
    address: '',
    phone: ''
  },
  
  setItems: (items) => set({ items }),
  setTable: (table) => set({ table }),
  setNotes: (notes) => set({ notes }),
  setOrderType: (orderType) => set({ orderType }),
  setDeliveryInfo: (deliveryInfo) => set({ deliveryInfo }),
  
  addItem: (itemToAdd, quantity, selectedExtras, notes) => set((state) => {
    const existingItemIndex = state.items.findIndex(i => 
      i.menuItem.id === itemToAdd.id && 
      JSON.stringify(i.selectedExtras?.map(e => e.id).sort()) === JSON.stringify(selectedExtras.map(e => e.id).sort()) &&
      i.notes === (notes || undefined)
    );

    if (existingItemIndex > -1) {
      const newItems = [...state.items];
      const existingItem = newItems[existingItemIndex];
      newItems[existingItemIndex] = {
        ...existingItem,
        quantity: existingItem.quantity + quantity,
      };
      return { items: newItems };
    } else {
      const newItem: OrderItem = {
        id: `${itemToAdd.id}-${Date.now()}`,
        menuItem: itemToAdd,
        quantity,
        status: KDS_STATES.NEW,
        selectedExtras,
        notes,
      };
      return { items: [...state.items, newItem] };
    }
  }),
  
  updateItem: (itemId, newQuantity, newSelectedExtras, notes) => set((state) => ({
    items: state.items.map(item =>
      item.id === itemId
        ? { 
            ...item, 
            quantity: newQuantity, 
            selectedExtras: newSelectedExtras, 
            notes 
          }
        : item
    )
  })),
  
  updateItemQuantity: (itemId, adjustment) => set((state) => {
    const itemIndex = state.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return state;
    
    const newItems = [...state.items];
    const item = newItems[itemIndex];
    
    const newQuantity = item.quantity + adjustment;

    if (newQuantity <= 0) {
      // Remove item if quantity is zero or less
      return { items: newItems.filter(i => i.id !== itemId) };
    } else {
      newItems[itemIndex] = { 
          ...item, 
          quantity: newQuantity,
      };
      return { items: newItems };
    }
  }),
  
  removeItem: (itemId) => set((state) => ({
    items: state.items.filter(item => item.id !== itemId)
  })),
  
  clearOrder: () => set({
    items: [],
    table: 1,
    notes: '',
    orderType: 'dine-in',
    deliveryInfo: { name: '', address: '', phone: '' }
  }),
}));

// Computed values - these will be used as selectors
export const useCurrentOrderTotals = () => {
  const items = useCurrentOrderStore(state => state.items);
  
  return useMemo(() => {
    const subtotal = items.reduce((acc, item) => {
      const extrasPrice = item.selectedExtras?.reduce((extraAcc, extra) => extraAcc + extra.price, 0) || 0;
      return acc + (item.menuItem.price + extrasPrice) * item.quantity;
    }, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [items]);
};

export const useCurrentOrderItemCountByCategory = () => {
  const items = useCurrentOrderStore(state => state.items);
  
  return useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      const category = item.menuItem.category;
      counts[category] = (counts[category] || 0) + item.quantity;
    });
    return counts;
  }, [items]);
};