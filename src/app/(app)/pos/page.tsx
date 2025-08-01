
"use client"
import React, { useState } from 'react';
import { type MenuItem, type Customer } from '@/lib/types';
import { CurrentOrder } from './components/current-order';
import { MenuSelection } from './components/menu-selection';
import { AddItemDialog } from './components/add-item-dialog';
import { PaymentDialog } from './components/payment-dialog';
import { toast } from "sonner";
import { useI18n } from '@/context/i18n-context';
import { addOrder } from '@/lib/mock-data';
import { useMenu } from '@/hooks/use-menu';
import { useCurrentOrder } from '@/hooks/use-current-order';

export default function PosPage() {
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const { t } = useI18n();
  
  const { menuItems, categories, customers, loading: menuLoading } = useMenu();
  const order = useCurrentOrder();

  const handleSelectItem = (item: MenuItem) => {
    setSelectedItem(item);
  };

  const handleAddItemToOrder = (item: MenuItem, quantity: number, selectedExtras: MenuItem[]) => {
    order.addItem(item, quantity, selectedExtras);
    toast.success(t('pos.toast.item_added', { item: item.name }), { duration: 3000 });
    setSelectedItem(null);
  };

  const handleSendToKitchen = async () => {
    if (order.items.length === 0) {
      toast.error(t('pos.toast.empty_order_title'), {
        description: t('pos.toast.empty_order_desc'),
        duration: 3000,
      });
      return;
    }

    try {
      await addOrder({
        table: order.table,
        items: order.items,
        customerId: order.customerId,
      });
      toast.success(t('pos.toast.order_sent_title'), {
        description: t('pos.toast.order_sent_desc'),
        duration: 3000,
      });
      order.clearOrder();
    } catch (error: any) {
       toast.error(t('toast.error'), {
        description: error.message || t('pos.toast.send_error'),
        duration: 3000,
      });
    }
  };

  const handleOpenPaymentDialog = () => {
    if (order.items.length === 0) {
      toast.error(t('pos.toast.empty_order_title'), {
        description: t('pos.toast.empty_order_payment_desc'),
        duration: 3000,
      });
      return;
    }
    setPaymentDialogOpen(true);
  }

  const handlePaymentSuccess = () => {
    setPaymentDialogOpen(false);
    toast.success(t('pos.toast.payment_success_title'), {
        description: t('pos.toast.payment_success_desc'),
        duration: 3000,
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
  
  const displayCategories = categories.filter(c => !c.isModifierGroup);
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
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:h-full md:max-h-[calc(100vh-120px)]">
        <div className="lg:col-span-2 h-full min-h-[400px] lg:min-h-0">
          <MenuSelection menuItems={displayItems} categories={displayCategories} onAddItem={handleSelectItem} />
        </div>
        <div className="lg:col-span-1 h-full min-h-[400px] lg:min-h-0">
          <CurrentOrder 
            order={order}
            customers={customers}
            onSendToKitchen={handleSendToKitchen}
            onPayment={handleOpenPaymentDialog}
          />
        </div>
      </div>
    </>
  );
}
