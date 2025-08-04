
"use client"
import React, { useState } from 'react';
import { type MenuItem, type OrderItem } from '@/lib/types';
import { CurrentOrder } from './components/current-order';
import { MenuSelection } from './components/menu-selection';
import { AddItemDialog } from './components/add-item-dialog';
import { PaymentDialog } from './components/payment-dialog';
import { toast } from "sonner";
import { useI18n } from '@/context/i18n-context';
import { addOrder } from '@/lib/mock-data';
import { useMenu } from '@/hooks/use-menu';
import { useCurrentOrder } from '@/hooks/use-current-order';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';


export default function PosPage() {
  const [editingOrderItem, setEditingOrderItem] = useState<OrderItem | null>(null);
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const { t } = useI18n();
  const isMobile = useIsMobile();
  
  const { menuItems, categories, loading: menuLoading } = useMenu();
  const order = useCurrentOrder();

  const handleAddItemToOrder = (item: MenuItem) => {
    order.addItem(item, 1, []);
  };
  
  const handleEditItem = (orderItem: OrderItem) => {
    setEditingOrderItem(orderItem);
  };

  const handleUpdateItemInOrder = (item: OrderItem, quantity: number, selectedExtras: MenuItem[], notes: string) => {
     order.updateItem(item.id, quantity, selectedExtras, notes);
     toast.success(t('pos.toast.item_updated', { item: item.menuItem.name }), { duration: 3000 });
     setEditingOrderItem(null);
  }

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
        notes: order.notes,
        orderType: order.orderType,
        deliveryInfo: order.deliveryInfo
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
  
  const isEditDialog = !!editingOrderItem;
  const dialogItem = editingOrderItem?.menuItem;
  
  const closeDialog = () => {
    setEditingOrderItem(null);
  }

  const handleDialogSave = (quantity: number, selectedExtras: MenuItem[], notes: string) => {
    if (isEditDialog && editingOrderItem) {
      handleUpdateItemInOrder(editingOrderItem, quantity, selectedExtras, notes);
    }
  }
  
  const currentOrderComponent = (
     <CurrentOrder 
        order={order}
        onSendToKitchen={handleSendToKitchen}
        onPayment={handleOpenPaymentDialog}
        onEditItem={handleEditItem}
      />
  )
  
  const menuSelectionComponent = (
     <MenuSelection menuItems={displayItems} categories={displayCategories} onAddItem={handleAddItemToOrder} />
  )

  const renderDesktopLayout = () => (
     <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start h-full">
        <div className="lg:col-span-3 h-full">
          {menuSelectionComponent}
        </div>
        <div className="lg:col-span-2 h-full">
          {currentOrderComponent}
        </div>
      </div>
  )
  
  const renderMobileLayout = () => (
      <Tabs defaultValue="menu" className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="menu">{t('pos.menu_selection.title')}</TabsTrigger>
            <TabsTrigger value="order" className="relative">
                {t('pos.current_order.title')}
                {order.items.length > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-1">{order.items.length}</Badge>
                )}
            </TabsTrigger>
        </TabsList>
        <TabsContent value="menu" className="flex-grow h-0">
          {menuSelectionComponent}
        </TabsContent>
        <TabsContent value="order" className="flex-grow h-0">
           {currentOrderComponent}
        </TabsContent>
    </Tabs>
  )


  return (
    <>
      {isEditDialog && dialogItem && (
        <AddItemDialog
          isOpen={isEditDialog}
          onOpenChange={(open) => !open && closeDialog()}
          item={dialogItem}
          orderItem={editingOrderItem}
          onSave={handleDialogSave}
          onRemove={order.removeItem}
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
      
      {isMobile ? renderMobileLayout() : renderDesktopLayout()}
    </>
  );
}
