
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

  const addItem = useCallback((itemToAdd: MenuItem, quantity: number, selectedExtras: MenuItem[], notes?: string) => {
    setItems(currentItems => {
      const existingItemIndex = currentItems.findIndex(i => 
        i.menuItem.id === itemToAdd.id && 
        JSON.stringify(i.selectedExtras?.map(e => e.id).sort()) === JSON.stringify(selectedExtras.map(e => e.id).sort()) &&
        i.notes === (notes || undefined)
      );

      if (existingItemIndex > -1) {
        const newItems = [...currentItems];
        const existingItem = newItems[existingItemIndex];
        newItems[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + quantity,
          newCount: existingItem.newCount + quantity,
        };
        return newItems;
      } else {
        const newItem: OrderItem = {
          id: `${itemToAdd.id}-${Date.now()}`,
          menuItem: itemToAdd,
          quantity,
          cookedCount: 0,
          newCount: quantity,
          cookingCount: 0,
          readyCount: 0,
          servedCount: 0,
          selectedExtras,
          notes,
        };
        return [...currentItems, newItem];
      }
    });
  }, []);

  const updateItem = useCallback((itemId: string, newQuantity: number, newSelectedExtras: MenuItem[], notes?: string) => {
    setItems(prev => prev.map(item =>
      item.id === itemId
        ? { 
            ...item, 
            quantity: newQuantity, 
            newCount: newQuantity, // Assume updates reset progress for simplicity
            cookingCount: 0,
            readyCount: 0,
            servedCount: 0,
            selectedExtras: newSelectedExtras, 
            notes 
          }
        : item
    ));
  }, []);

  const updateItemQuantity = useCallback((itemId: string, adjustment: number) => {
    setItems(prev => {
      const itemIndex = prev.findIndex(item => item.id === itemId);
      if (itemIndex === -1) return prev;
      
      const newItems = [...prev];
      const item = newItems[itemIndex];
      
      const newQuantity = item.quantity + adjustment;

      if (newQuantity <= 0) {
        // Remove item if quantity is zero or less
        return newItems.filter(i => i.id !== itemId);
      } else {
        newItems[itemIndex] = { 
            ...item, 
            quantity: newQuantity,
            // Adjust the 'newCount' proportionally or just add/remove from it
            newCount: Math.max(0, item.newCount + adjustment)
        };
        return newItems;
      }
    });
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
    updateItemQuantity,
    removeItem,
    clearOrder,
    subtotal,
    tax,
    total
  };
};
