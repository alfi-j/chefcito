
"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { type OrderItem, type MenuItem, type Category, type Extra } from '@/lib/types';
import { CurrentOrder } from './components/current-order';
import { MenuSelection } from './components/menu-selection';
import { PaymentDialog } from './components/payment-dialog';
import { AddItemDialog } from './components/add-item-dialog';
import { useToast } from "@/hooks/use-toast";
import { useI18n } from '@/context/i18n-context';
import { getMenuItems, getCategories, addOrder } from '@/lib/mock-data';

export default function PosPage() {
  const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const { toast } = useToast();
  const { t } = useI18n();

  const fetchMenuData = useCallback(() => {
    setLoading(true);
    try {
        setMenuItems(getMenuItems());
        setCategories(getCategories());
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
  
  const handleSelectItem = (item: MenuItem) => {
    setSelectedItem(item);
  };

  const handleAddItemToOrder = (item: MenuItem, quantity: number, selectedExtras: Extra[]) => {
    setCurrentOrderItems(prev => {
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
    toast({
      title: t('pos.toast.item_added', { item: item.name }),
    });
    setSelectedItem(null);
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

  const handleSendToKitchen = () => {
    if (currentOrderItems.length === 0) {
      toast({
        title: t('pos.toast.empty_order_title'),
        description: t('pos.toast.empty_order_desc'),
        variant: "destructive"
      });
      return;
    }

    try {
      addOrder({
        table: 4, // Mock table number
        items: currentOrderItems,
      });
      toast({
        title: t('pos.toast.order_sent_title'),
        description: t('pos.toast.order_sent_desc'),
      });
      handleClearOrder();
    } catch (error: any) {
       toast({
        title: t('toast.error'),
        description: error.message || t('pos.toast.send_error'),
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

  const subtotal = currentOrderItems.reduce((acc, item) => {
    const extrasPrice = item.selectedExtras?.reduce((extraAcc, extra) => extraAcc + extra.price, 0) || 0;
    return acc + (item.menuItem.price + extrasPrice) * item.quantity;
  }, 0);
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
      {selectedItem && (
        <AddItemDialog
          item={selectedItem}
          isOpen={!!selectedItem}
          onOpenChange={(open) => !open && setSelectedItem(null)}
          onAddItem={handleAddItemToOrder}
        />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-120px)]">
        <div className="lg:col-span-2 h-full">
          <MenuSelection menuItems={menuItems} categories={categories.map(c => c.name)} onAddItem={handleSelectItem} />
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
