
"use client"

import { useState, useMemo, useCallback } from 'react';
import { type OrderItem, type MenuItem, type OrderType, type DeliveryInfo } from '@/lib/types';

export const useCurrentOrder = () => {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [table, setTable] = useState(1);
  const [notes, setNotes] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    name: '',
    address: '',
    phone: ''
  });

  const addItem = useCallback((item: MenuItem, quantity: number, selectedExtras: MenuItem[], notes?: string) => {
    setItems(prev => {
      const newItem: OrderItem = {
        id: `${item.id}-${Date.now()}`,
        menuItem: item,
        quantity,
        cookedCount: 0,
        status: 'New',
        selectedExtras,
        notes,
      };
      return [...prev, newItem];
    });
  }, []);

  const updateItem = useCallback((itemId: string, newQuantity: number, newSelectedExtras: MenuItem[], notes?: string) => {
    setItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, quantity: newQuantity, selectedExtras: newSelectedExtras, notes }
        : item
    ));
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const clearOrder = useCallback(() => {
    setItems([]);
    setTable(1);
    setNotes('');
    setOrderType('dine-in');
    setDeliveryInfo({ name: '', address: '', phone: '' });
  }, []);

  const { subtotal, tax, total } = useMemo(() => {
    const currentSubtotal = items.reduce((acc, item) => {
      const extrasPrice = item.selectedExtras?.reduce((extraAcc, extra) => extraAcc + extra.price, 0) || 0;
      return acc + (item.menuItem.price + extrasPrice) * item.quantity;
    }, 0);
    const currentTax = currentSubtotal * 0.08;
    const currentTotal = currentSubtotal + currentTax;
    return { subtotal: currentSubtotal, tax: currentTax, total: currentTotal };
  }, [items]);

  return {
    items,
    table,
    setTable,
    notes,
    setNotes,
    orderType,
    setOrderType,
    deliveryInfo,
    setDeliveryInfo,
    addItem,
    updateItem,
    removeItem,
    clearOrder,
    subtotal,
    tax,
    total
  };
};
