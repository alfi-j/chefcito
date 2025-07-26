
"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { type OrderItem, type MenuItem, type Category } from '@/lib/types';
import { CurrentOrder } from './components/current-order';
import { MenuSelection } from './components/menu-selection';
import { useToast } from "@/hooks/use-toast";

export default function PosPage() {
  const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMenuData = useCallback(async () => {
    setLoading(true);
    try {
        const [itemsRes, catsRes] = await Promise.all([
            fetch('/api/menu'),
            fetch('/api/categories'),
        ]);
        if (!itemsRes.ok || !catsRes.ok) {
            throw new Error('Failed to fetch menu data');
        }
        const items = await itemsRes.json();
        const cats = await catsRes.json();
        setMenuItems(items);
        setCategories(cats);
    } catch(error) {
        console.error("Failed to fetch menu data:", error);
        toast({ title: "Error", description: "Could not fetch menu data.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);
  
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

  const handleSendToKitchen = async () => {
    if (currentOrderItems.length === 0) {
      toast({
        title: "Empty Order",
        description: "Cannot send an empty order to the kitchen.",
        variant: "destructive"
      });
      return;
    }

    const orderToCreate = {
      table: 4, // Mock table number
      items: currentOrderItems.map(item => ({
        menuItemId: item.menuItem.id,
        quantity: item.quantity,
      })),
    };
    
    const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderToCreate),
    });
    
    if (res.ok) {
      toast({
        title: "Order Sent!",
        description: "The order has been sent to the kitchen.",
      });
      handleClearOrder();
    } else {
      const { error } = await res.json();
      toast({
        title: "Error",
        description: error || "Failed to send order to the kitchen.",
        variant: "destructive"
      });
    }
  };


  if (loading) {
     return (
        <div className="flex justify-center items-center h-full">
            <p>Loading menu...</p>
        </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-120px)]">
      <div className="lg:col-span-2 h-full">
        <MenuSelection menuItems={menuItems} categories={categories.map(c => c.name)} onAddItem={handleAddItem} />
      </div>
      <div className="lg:col-span-1 h-full">
        <CurrentOrder 
          items={currentOrderItems} 
          onUpdateQuantity={handleUpdateQuantity} 
          onRemoveItem={handleRemoveItem}
          onClearOrder={handleClearOrder}
          onSendToKitchen={handleSendToKitchen}
        />
      </div>
    </div>
  );
}
