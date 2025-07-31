
"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { type OrderItem, type MenuItem, type Category } from '@/lib/types';
import { CurrentOrder } from './components/current-order';
import { MenuSelection } from './components/menu-selection';
import { PaymentDialog } from './components/payment-dialog';
import { useToast } from "@/hooks/use-toast";
import { useI18n } from '@/context/i18n-context';

export default function PosPage() {
  const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();

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
        toast({ title: t('toast.error'), description: t('pos.toast.fetch_error'), variant: "destructive" });
    } finally {
        setLoading(false);
    }
  }, [toast, t]);
  
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
      title: t('pos.toast.item_added', { item: item.name }),
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
        title: t('pos.toast.empty_order_title'),
        description: t('pos.toast.empty_order_desc'),
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
        title: t('pos.toast.order_sent_title'),
        description: t('pos.toast.order_sent_desc'),
      });
      handleClearOrder();
    } else {
      const { error } = await res.json();
      toast({
        title: t('toast.error'),
        description: error || t('pos.toast.send_error'),
        variant: "destructive"
      });
    }
  };

  const handleOpenPaymentDialog = () => {
     if (currentOrderItems.length === 0) {
      toast({
        title: t('pos.toast.empty_order_title'),
        description: t('pos.toast.empty_order_payment_desc'),
        variant: "destructive"
      });
      return;
    }
    setPaymentDialogOpen(true);
  }

  const handleConfirmPayment = () => {
    toast({
      title: t('pos.toast.payment_success_title'),
      description: t('pos.toast.payment_success_desc'),
    });
    handleClearOrder();
    setPaymentDialogOpen(false);
  }

  if (loading) {
     return (
        <div className="flex justify-center items-center h-full">
            <p>{t('pos.loading')}</p>
        </div>
    )
  }

  const subtotal = currentOrderItems.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <>
      <PaymentDialog
        isOpen={isPaymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        totalAmount={total}
        onConfirmPayment={handleConfirmPayment}
      />
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
            onPayment={handleOpenPaymentDialog}
            subtotal={subtotal}
            tax={tax}
            total={total}
          />
        </div>
      </div>
    </>
  );
}
