
"use client"
import React, { useState } from 'react';
import { type OrderItem, type MenuItem } from '@/lib/types';
import { CurrentOrder } from './components/current-order';
import { MenuSelection } from './components/menu-selection';
import { AddItemDialog } from './components/add-item-dialog';
import { PaymentDialog } from './components/payment-dialog';
import { useToast } from "@/hooks/use-toast";
import { useI18n } from '@/context/i18n-context';
import { addOrder } from '@/lib/mock-data';
import { useMenu } from '@/hooks/use-menu';

export default function PosPage() {
  const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();
  
  const { menuItems, categories, loading } = useMenu();

  const handleSelectItem = (item: MenuItem) => {
    setSelectedItem(item);
  };

  const handleAddItemToOrder = (item: MenuItem, quantity: number, selectedExtras: MenuItem[]) => {
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

  const handleSendToKitchen = async () => {
    if (currentOrderItems.length === 0) {
      toast({
        title: t('pos.toast.empty_order_title'),
        description: t('pos.toast.empty_order_desc'),
        variant: "destructive"
      });
      return;
    }

    try {
      await addOrder({
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

  const handlePaymentSuccess = () => {
    setPaymentDialogOpen(false);
    toast({
      title: t('pos.toast.payment_success_title'),
      description: t('pos.toast.payment_success_desc'),
    });
    handleClearOrder();
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
  
  const displayCategories = categories.filter(c => !c.isModifierGroup).map(c => c.name);
  const displayItems = menuItems.filter(i => !categories.find(c => c.name === i.category)?.isModifierGroup)

  return (
    <>
      {selectedItem && (
        <AddItemDialog
          item={selectedItem}
          isOpen={!!selectedItem}
          onOpenChange={(open) => !open && setSelectedItem(null)}
          onAddItem={handleAddItemToOrder}
        />
      )}
      
      <PaymentDialog
        isOpen={isPaymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        orderItems={currentOrderItems}
        totalAmount={total}
        onConfirmPayment={handlePaymentSuccess}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-120px)]">
        <div className="lg:col-span-2 h-full">
          <MenuSelection menuItems={displayItems} categories={displayCategories} onAddItem={handleSelectItem} />
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
