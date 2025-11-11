import useSWR from 'swr';
import { useEffect, useMemo } from 'react';
import { useCurrentOrderStore } from '@/lib/stores/current-order-store';
import { fetcher } from '@/lib/swr-fetcher';
import { type MenuItem, type Category, type Payment, type Order, type OrderType } from '@/lib/types';

interface PosData {
  // SWR data
  menuItems: MenuItem[];
  categories: Category[];
  workstations: any[];
  orders: Order[];
  paymentMethods: Payment[];
  
  // Zustand actions
  addItem: (itemToAdd: MenuItem, quantity: number, selectedExtras: MenuItem[], notes?: string, workstationId?: string) => void;
  updateItem: (itemId: string, newQuantity: number, newSelectedExtras: MenuItem[], notes?: string, workstationId?: string) => void;
  removeItem: (itemId: string) => void;
  clearOrder: () => void;
  setTable: (table: number) => void;
  setNotes: (notes: string) => void;
  setOrderType: (orderType: OrderType) => void;
  setDeliveryInfo: (deliveryInfo: { name: string; address: string; phone: string }) => void;
  updateItemQuantity: (itemId: string, adjustment: number) => void;
  
  // Current order state
  items: any[];
  table: number;
  notes: string;
  orderType: OrderType;
  deliveryInfo: { name: string; address: string; phone: string };
  
  // Computed values
  subtotal: number;
  tax: number;
  total: number;
  itemCountByCategory: Record<string, number>;
  
  // Loading states
  isLoading: boolean;
  isLoadingMenu: boolean;
  isLoadingCategories: boolean;
  isLoadingWorkstations: boolean;
  isLoadingOrders: boolean;
  isLoadingPayments: boolean;
  
  // Mutations
  mutateOrders: () => Promise<any>;
  mutateMenuItems: () => Promise<any>;
  mutateCategories: () => Promise<any>;
  mutateWorkstations: () => Promise<any>;
  mutatePayments: () => Promise<any>;
}

export const usePosData = (): PosData => {
  // SWR data fetching
  const { data: menuItems = [], error: menuItemsError, isLoading: isLoadingMenu, mutate: mutateMenuItems } = useSWR<MenuItem[]>('/api/menu', fetcher, {
    fallbackData: [],
  });
  
  const { data: categories = [], error: categoriesError, isLoading: isLoadingCategories, mutate: mutateCategories } = useSWR<Category[]>('/api/categories', fetcher, {
    fallbackData: [],
  });
  
  const { data: workstations = [], error: workstationsError, isLoading: isLoadingWorkstations, mutate: mutateWorkstations } = useSWR<any[]>('/api/workstations', fetcher, {
    fallbackData: [],
  });
  
  const { data: orders = [], error: ordersError, isLoading: isLoadingOrders, mutate: mutateOrders } = useSWR<Order[]>('/api/orders', fetcher, {
    fallbackData: [],
    revalidateOnMount: true,
    shouldRetryOnError: true
  });
  
  const { data: paymentMethods = [], error: paymentMethodsError, isLoading: isLoadingPayments, mutate: mutatePayments } = useSWR<Payment[]>(
    '/api/payments',
    fetcher,
    {
      fallbackData: [],
      revalidateOnMount: true,
      shouldRetryOnError: true
    }
  );
  
  // Zustand store
  const currentOrderItems = useCurrentOrderStore(state => state.items);
  const currentOrderTable = useCurrentOrderStore(state => state.table);
  const currentOrderNotes = useCurrentOrderStore(state => state.notes);
  const currentOrderType = useCurrentOrderStore(state => state.orderType);
  const currentOrderDeliveryInfo = useCurrentOrderStore(state => state.deliveryInfo);
  const currentOrderSetTable = useCurrentOrderStore(state => state.setTable);
  const currentOrderSetNotes = useCurrentOrderStore(state => state.setNotes);
  const currentOrderSetOrderType = useCurrentOrderStore(state => state.setOrderType);
  const currentOrderSetDeliveryInfo = useCurrentOrderStore(state => state.setDeliveryInfo);
  const currentOrderAddItem = useCurrentOrderStore(state => state.addItem);
  const currentOrderUpdateItem = useCurrentOrderStore(state => state.updateItem);
  const currentOrderRemoveItem = useCurrentOrderStore(state => state.removeItem);
  const currentOrderClearOrder = useCurrentOrderStore(state => state.clearOrder);
  const currentOrderUpdateItemQuantity = useCurrentOrderStore(state => state.updateItemQuantity);
  
  // Computed values from Zustand - properly memoized
  const { subtotal, tax, total } = useMemo(() => ({
    subtotal: currentOrderItems.reduce((acc, item) => {
      const extrasPrice = item.selectedExtras?.reduce((extraAcc, extra) => extraAcc + extra.price, 0) || 0;
      return acc + (item.menuItem.price + extrasPrice) * item.quantity;
    }, 0),
    tax: currentOrderItems.reduce((acc, item) => {
      const extrasPrice = item.selectedExtras?.reduce((extraAcc, extra) => extraAcc + extra.price, 0) || 0;
      return acc + (item.menuItem.price + extrasPrice) * item.quantity;
    }, 0) * 0.08,
    total: currentOrderItems.reduce((acc, item) => {
      const extrasPrice = item.selectedExtras?.reduce((extraAcc, extra) => extraAcc + extra.price, 0) || 0;
      return acc + (item.menuItem.price + extrasPrice) * item.quantity;
    }, 0) * 1.08
  }), [currentOrderItems]);
  
  const itemCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    currentOrderItems.forEach(item => {
      const category = item.menuItem.category;
      counts[category] = (counts[category] || 0) + item.quantity;
    });
    return counts;
  }, [currentOrderItems]);

  // Combine loading states
  const isLoading = isLoadingMenu || isLoadingCategories || isLoadingWorkstations || isLoadingOrders || isLoadingPayments;
  
  return {
    // SWR data
    menuItems,
    categories,
    workstations,
    orders,
    paymentMethods,
    
    // Zustand actions
    addItem: currentOrderAddItem,
    updateItem: currentOrderUpdateItem,
    removeItem: currentOrderRemoveItem,
    clearOrder: currentOrderClearOrder,
    setTable: currentOrderSetTable,
    setNotes: currentOrderSetNotes,
    setOrderType: currentOrderSetOrderType,
    setDeliveryInfo: currentOrderSetDeliveryInfo,
    updateItemQuantity: currentOrderUpdateItemQuantity,
    
    // Current order state
    items: currentOrderItems,
    table: currentOrderTable,
    notes: currentOrderNotes,
    orderType: currentOrderType,
    deliveryInfo: currentOrderDeliveryInfo,
    
    // Computed values
    subtotal,
    tax,
    total,
    itemCountByCategory,
    
    // Loading states
    isLoading,
    isLoadingMenu,
    isLoadingCategories,
    isLoadingWorkstations,
    isLoadingOrders,
    isLoadingPayments,
    
    // Mutations
    mutateOrders,
    mutateMenuItems,
    mutateCategories,
    mutateWorkstations,
    mutatePayments
  };
};