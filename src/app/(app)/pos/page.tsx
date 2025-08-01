
"use client"
import React, { useState } from 'react';
import { type MenuItem } from '@/lib/types';
import { CurrentOrder } from './components/current-order';
import { MenuSelection } from './components/menu-selection';
import { AddItemDialog } from './components/add-item-dialog';
import { PaymentDialog } from './components/payment-dialog';
import { useToast } from "@/hooks/use-toast";
import { useI18n } from '@/context/i18n-context';
import { addOrder } from '@/lib/mock-data';
import { useMenu } from '@/hooks/use-menu';
import { useCurrentOrder } from '@/hooks/use-current-order';

export default function PosPage() {
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();
  
  const { menuItems, categories, loading: menuLoading } = useMenu();
  const order = useCurrentOrder();

  const handleSelectItem = (item: MenuItem) => {
    setSelectedItem(item);
  };

  const handleAddItemToOrder = (item: MenuItem, quantity: number, selectedExtras: MenuItem[]) => {
    order.addItem(item, quantity, selectedExtras);
    toast({
      title: t('pos.toast.item_added', { item: item.name }),
    });
    setSelectedItem(null);
  };

  const handleSendToKitchen = async () => {
    if (order.items.length === 0) {
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
        items: order.items,
      });
      toast({
        title: t('pos.toast.order_sent_title'),
        description: t('pos.toast.order_sent_desc'),
      });
      order.clearOrder();
    } catch (error: any) {
       toast({
        title: t('toast.error'),
        description: error.message || t('pos.toast.send_error'),
        variant: "destructive"
      });
    }
  };

  const handleOpenPaymentDialog = () => {
    if (order.items.length === 0) {
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
    order.clearOrder();
  }
  
  if (menuLoading) {
     return (
        <div className="flex justify-center items-center h-full">
            <p>{t('pos.loading')}</p>
        </div>
    )
  }
  
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
          menuItems={menuItems}
          categories={categories}
        />
      )}
      
      <PaymentDialog
        isOpen={isPaymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        orderItems={order.items}
        totalAmount={order.total}
        onConfirmPayment={handlePaymentSuccess}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-120px)]">
        <div className="lg:col-span-2 h-full">
          <MenuSelection menuItems={displayItems} categories={displayCategories} onAddItem={handleSelectItem} />
        </div>
        <div className="lg:col-span-1 h-full">
          <CurrentOrder 
            items={order.items} 
            onUpdateQuantity={order.updateQuantity} 
            onRemoveItem={order.removeItem}
            onClearOrder={order.clearOrder}
            onSendToKitchen={handleSendToKitchen}
            onPayment={handleOpenPaymentDialog}
            subtotal={order.subtotal}
            tax={order.tax}
            total={order.total}
          />
        </div>
      </div>
    </>
  );
}
