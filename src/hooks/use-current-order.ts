
"use client"

import { useState, useMemo, useCallback } from 'react';
import { type OrderItem, type MenuItem } from '@/lib/types';

export const useCurrentOrder = () => {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [table, setTable] = useState(1);
  const [customerId, setCustomerId] = useState<string | undefined>(undefined);

  const addItem = useCallback((item: MenuItem, quantity: number, selectedExtras: MenuItem[]) => {
    setItems(prev => {
      const newItem: OrderItem = {
        id: `${item.id}-${Date.now()}`,
        menuItem: item,
        quantity,
        cookedCount: 0,
        status: 'New',
        selectedExtras
      };
      return [...prev, newItem];
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
    } else {
       setItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  }, [removeItem]);

  const clearOrder = useCallback(() => {
    setItems([]);
    setTable(1);
    setCustomerId(undefined);
  }, []);

  const { subtotal, tax, total } = useMemo(() => {
    const subtotal = items.reduce((acc, item) => {
      const extrasPrice = item.selectedExtras?.reduce((extraAcc, extra) => extraAcc + extra.price, 0) || 0;
      return acc + (item.menuItem.price + extrasPrice) * item.quantity;
    }, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [items]);

  return {
    items,
    table,
    setTable,
    customerId,
    setCustomerId,
    addItem,
    removeItem,
    updateQuantity,
    clearOrder,
    subtotal,
    tax,
    total
  };
};
