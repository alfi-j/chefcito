"use client"
import React, { useState } from 'react';
import { menuItems, menuCategories, type OrderItem, type MenuItem } from '@/lib/data';
import { CurrentOrder } from './components/current-order';
import { MenuSelection } from './components/menu-selection';
import { useToast } from "@/hooks/use-toast"

export default function PosPage() {
  const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
  const { toast } = useToast()
  
  const handleAddItem = (item: MenuItem) => {
    setCurrentOrderItems(prev => {
      const existingItem = prev.find(orderItem => orderItem.menuItem.id === item.id);
      if (existingItem) {
        return prev.map(orderItem => 
          orderItem.menuItem.id === item.id 
            ? { ...orderItem, quantity: orderItem.quantity + 1 }
            : orderItem
        );
      }
      return [...prev, { id: `${item.id}-${Date.now()}`, menuItem: item, quantity: 1, cookedCount: 0, status: 'New' }];
    });
    toast({
      title: `${item.name} added`,
    })
  };

  const handleRemoveItem = (itemId: string) => {
    setCurrentOrderItems(prev => prev.filter(item => item.id !== itemId));
  };
  
  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    setCurrentOrderItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const handleClearOrder = () => {
    setCurrentOrderItems([]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-120px)]">
      <div className="lg:col-span-2 h-full">
        <MenuSelection menuItems={menuItems} categories={menuCategories} onAddItem={handleAddItem} />
      </div>
      <div className="lg:col-span-1 h-full">
        <CurrentOrder 
          items={currentOrderItems} 
          onUpdateQuantity={handleUpdateQuantity} 
          onRemoveItem={handleRemoveItem}
          onClearOrder={handleClearOrder}
        />
      </div>
    </div>
  );
}
