"use client"
import React, { useState, useEffect, Suspense } from 'react';
import { type MenuItem, type OrderItem, type Order, type DeliveryInfo, type Payment } from '@/lib/types';
import { type IWorkstation } from '@/models/Workstation';
import { MenuSelection } from '@/components/pos/menu-panel';
import { AddItemDialog } from '@/components/pos/dialogs/add-item-modal';
import { PaymentDialogRefactored } from '@/components/pos/dialogs/payment-modal';
import { SheetCart } from '@/components/pos/cart-sheet';
import { toast } from "sonner";
import { useTranslation } from 'react-i18next';
import { useUserStore } from '@/lib/stores/user-store';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { History, ShoppingCart, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ReceiptDialog } from '@/components/pos/dialogs/receipt-modal'
import { OrderDetailsDialog } from '@/components/pos/dialogs/order-details-modal'
import { type Category } from '@/lib/types'
import { useCurrentOrderStoreCompat as useCurrentOrderStore, useCurrentOrderTotalsCompat as useCurrentOrderTotals } from '@/lib/stores/current-order-store';
import { fetcher } from '@/lib/swr-fetcher';

interface KitchenOrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  selectedExtraIds: string[];
  notes: string;
  status: string;
  workstationId: string | null;
  originalItemId?: string;
  unitNumber?: number;
  totalUnits?: number;
}

interface SendOrderPayload {
  restaurantId: string;
  table: number;
  items: KitchenOrderItem[];
  notes: string;
  orderType: string;
  createdAt: string;
  status: string;
  staffName: string;
  deliveryInfo?: DeliveryInfo;
}

function PosPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [editingOrderItem, setEditingOrderItem] = useState<OrderItem | null>(null);
  const [isPaymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedOrder] = useState<Order | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSendingToKitchen, setIsSendingToKitchen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isEditingOrder, setIsEditingOrder] = useState<Order | null>(null);

  const { t } = useTranslation();
  const user = useUserStore((state) => state.getCurrentUser());

  // SWR data fetching - filter menu items by restaurant
  const menuApiUrl = user?.restaurantId ? `/api/menu?restaurantId=${encodeURIComponent(user.restaurantId)}` : '/api/menu';
  const { data: menuItems = [], error: menuItemsError } = useSWR<MenuItem[]>(menuApiUrl, fetcher, {
    fallbackData: [],
  });

  const { data: categories = [], error: categoriesError } = useSWR<Category[]>(
    user?.restaurantId ? `/api/categories?restaurantId=${encodeURIComponent(user.restaurantId)}` : null,
    fetcher,
    {
      fallbackData: [],
    }
  );

  const { data: workstations = [], error: workstationsError } = useSWR<IWorkstation[]>(
    user?.restaurantId ? `/api/workstations?restaurantId=${encodeURIComponent(user.restaurantId)}` : null,
    fetcher, {
    fallbackData: [],
  });

  const { data: orders = [], error: ordersError, mutate: mutateOrders } = useSWR<Order[]>(
    user?.restaurantId ? `/api/orders?restaurantId=${encodeURIComponent(user.restaurantId)}` : null,
    fetcher, {
    fallbackData: [],
    revalidateOnMount: true,
    shouldRetryOnError: true
  });

  const { data: paymentMethods = [], error: paymentMethodsError } = useSWR<Payment[]>(
    user?.restaurantId ? `/api/payments?restaurantId=${encodeURIComponent(user.restaurantId)}` : null,
    fetcher,
    {
      fallbackData: [],
      revalidateOnMount: true,
      shouldRetryOnError: true
    }
  );

  // Zustand store
  const {
    items: currentOrderItems,
    table: currentOrderTable,
    notes: currentOrderNotes,
    orderType: currentOrderType,
    deliveryInfo: currentOrderDeliveryInfo,
    setTable: currentOrderSetTable,
    setNotes: currentOrderSetNotes,
    setOrderType: currentOrderSetOrderType,
    setDeliveryInfo: currentOrderSetDeliveryInfo,
    addItem: currentOrderAddItem,
    updateItem: currentOrderUpdateItem,
    removeItem: currentOrderRemoveItem,
    clearOrder: currentOrderClearOrder
  } = useCurrentOrderStore();

  // Computed values from Zustand
  const { total } = useCurrentOrderTotals();

  // Verificar autenticación al montar
  useEffect(() => {
    const storedUser = localStorage.getItem('chefcito-user');
    if (!storedUser) {
      console.log('[POS] No hay usuario autenticado, redirigiendo a /login');
      router.push('/login');
    }
  }, [router]);

  // Check for editOrder parameter and load the order
  useEffect(() => {
    const editOrderId = searchParams?.get('editOrder');
    if (editOrderId && orders && orders.length > 0) {
      const orderToEdit = orders.find(order => order.id === parseInt(editOrderId));
      if (orderToEdit) {
        // Clear current order first
        currentOrderClearOrder();

        const items = Array.isArray(orderToEdit.items) ? orderToEdit.items : [];

        // Add each item from the selected order to the current order
        items.forEach(item => {
          if (!item.menuItem) return;
          const orderItem: MenuItem = {
            ...item.menuItem,
            id: `${Date.now()}-${Math.random()}`, // Generate new ID for the order item
          };
          currentOrderAddItem(orderItem, item.quantity, item.selectedExtras || [], item.notes, item.workstationId);
        });

        // Set other order properties
        if (orderToEdit.orderType === 'delivery' && orderToEdit.deliveryInfo) {
          currentOrderSetDeliveryInfo(orderToEdit.deliveryInfo);
        }
        currentOrderSetOrderType(orderToEdit.orderType);
        currentOrderSetTable(orderToEdit.table);
        currentOrderSetNotes(orderToEdit.notes || '');

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsEditingOrder(orderToEdit);
        setIsCartOpen(true); // Automatically open the cart when editing an order

        // Remove the query parameter from the URL
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('editOrder');
        router.replace(`/pos?${newSearchParams.toString()}`, { scroll: false });
      }
    }
  }, [searchParams, orders, router, currentOrderAddItem, currentOrderClearOrder, currentOrderSetDeliveryInfo, currentOrderSetNotes, currentOrderSetOrderType, currentOrderSetTable]);
  
  // Make sure we have default values
  const safeMenuItems = menuItems || [];
  const safeCategories = categories || [];
  const safePaymentMethods = paymentMethods || [];
  const safeWorkstations = workstations || [];
  
  // Si no hay usuario, mostrar loading
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t('pos.loading')}</p>
        </div>
      </div>
    );
  }

  const handleUpdateEditedOrder = async () => {
    if (!isEditingOrder) return;
    
    try {
      // Prepare updated order data
      const updatedOrderData = {
        table: currentOrderTable,
        items: currentOrderItems,
        notes: currentOrderNotes,
        orderType: currentOrderType,
        deliveryInfo: currentOrderType === 'delivery' ? currentOrderDeliveryInfo : undefined,
        restaurantId: user?.restaurantId || '', // Use authenticated user's restaurantId
      };
      
      const response = await fetch(`/api/orders/${isEditingOrder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedOrderData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update order');
      }
      
      // Refresh the orders list
      mutateOrders();
      
      // Clear editing state
      setIsEditingOrder(null);
      
      // Clear current order
      currentOrderClearOrder();
      
      toast.success(t('orders.toast.updated'), {
        description: t('orders.toast.updated_desc'),
        duration: 3000,
      });
    } catch (error: unknown) {
      toast.error(t('toast.error'), {
        description: error instanceof Error ? error.message : t('orders.toast.update_error'),
        duration: 3000,
      });
    }
  };

  const handleAddItemToOrder = (item: MenuItem) => {
    // Always open dialog to allow workstation assignment for all items
    const newItem: OrderItem = {
        id: `${item.id}-${Date.now()}`,
        menuItem: item,
        quantity: 1,
        status: 'new',
        selectedExtras: [],
        notes: '',
        workstationId: undefined
    };
    setEditingOrderItem(newItem);
  };

  const handleEditItem = (orderItem: OrderItem) => {
    setEditingOrderItem(orderItem);
  };

  const handleUpdateItemInOrder = (item: OrderItem, quantity: number, selectedExtras: MenuItem[], notes: string, workstationId?: string) => {
     currentOrderUpdateItem(item.id, quantity, selectedExtras, notes, workstationId);
     toast.success(t('pos.toast.item_updated', { item: item.menuItem.name }), { duration: 3000 });
     setEditingOrderItem(null);
  }
  
  const handleSaveNewItem = (quantity: number, selectedExtras: MenuItem[], notes: string, workstationId?: string) => {
    if (editingOrderItem) {
      currentOrderAddItem(editingOrderItem.menuItem, quantity, selectedExtras, notes, workstationId);
      setEditingOrderItem(null);
    }
  }

  const handleSendToKitchen = async () => {
    if (currentOrderItems.length === 0) {
      toast.error(t('pos.toast.empty_order_title'), {
        description: t('pos.toast.empty_order_desc'),
        duration: 3000,
      });
      return;
    }

    // Prevent double submission
    if (isSendingToKitchen) {
      return;
    }

    try {
      setIsSendingToKitchen(true);
      
      // Get the first workstation (if available) from SWR data
      const firstWorkstation = safeWorkstations[0] || null;
      
      // Split quantity-based items into individual units for KDS tracking
      const expandedItems: Array<{ 
        id: string; 
        menuItemId: string; 
        name: string; 
        price: number; 
        quantity: number; 
        selectedExtraIds: string[]; 
        notes: string; 
        status: string; 
        workstationId: string | null; 
        originalItemId: string; 
        unitNumber: number; 
        totalUnits: number 
      }> = [];
      currentOrderItems.forEach((item: OrderItem) => {
        if (!item.menuItem) return;
        // Create individual units for each quantity
        for (let i = 0; i < item.quantity; i++) {
          expandedItems.push({
            id: `${item.id}-unit-${i + 1}`,
            menuItemId: item.menuItem.id,
            name: item.menuItem.name,
            price: item.menuItem.price,
            quantity: 1, // Each unit has quantity 1
            selectedExtraIds: item.selectedExtras?.map((extra: MenuItem) => extra.id) || [],
            notes: item.notes || '',
            // Initialize status for KDS tracking
            status: 'new',
            workstationId: item.workstationId || (firstWorkstation ? firstWorkstation.id : null),
            // Store original grouping info for stacking display
            originalItemId: item.id,
            unitNumber: i + 1,
            totalUnits: item.quantity
          });
        }
      });

      // Prepare order data based on order type
      const orderData: SendOrderPayload = {
        restaurantId: user?.restaurantId || '',
        table: currentOrderTable,
        items: expandedItems,
        notes: currentOrderNotes,
        orderType: currentOrderType,
        createdAt: new Date().toISOString(),
        status: 'pending',
        staffName: 'POS Terminal'
      };

      console.log('Sending order to kitchen:', orderData);

      // Only include deliveryInfo for delivery orders
      if (currentOrderType === 'delivery' && currentOrderDeliveryInfo) {
        orderData.deliveryInfo = currentOrderDeliveryInfo;
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send order to kitchen');
      }
      
      toast.success(t('pos.toast.order_sent_title'), {
        description: t('pos.toast.order_sent_desc'),
        duration: 3000,
      });
      currentOrderClearOrder();
      mutateOrders(); // Refresh orders list
    } catch (error: unknown) {
       toast.error(t('toast.error'), {
        description: error instanceof Error ? error.message : t('pos.toast.send_error'),
        duration: 5000,
      });
    } finally {
      setIsSendingToKitchen(false);
    }
  };

  const handleOpenPaymentDialog = () => {
    if (currentOrderItems.length === 0) {
      toast.error(t('pos.toast.empty_order_title'), {
        description: t('pos.toast.empty_order_payment_desc'),
        duration: 3000,
      });
      return;
    }
    setPaymentSheetOpen(true);
  }

  const handlePaymentSuccess = async () => {
    setPaymentSheetOpen(false);
    
    // Prevent double submission
    if (isProcessingPayment) {
      return;
    }
    
    // Send order as completed
    try {
      setIsProcessingPayment(true);
      
      // Get the first workstation (if available) from SWR data
      const firstWorkstation = safeWorkstations[0] || null;
      
      // Prepare order data based on order type
      const orderData: SendOrderPayload = {
        restaurantId: user?.restaurantId || '',
        table: currentOrderTable,
        items: currentOrderItems.map((item: OrderItem) => ({
          id: item.id,
          menuItemId: item.menuItem.id,
          name: item.menuItem.name,
          price: item.menuItem.price,
          quantity: item.quantity,
          selectedExtraIds: item.selectedExtras?.map((extra: MenuItem) => extra.id) || [],
          notes: item.notes || '',
          // For completed orders, mark all as served
          status: 'served',
          workstationId: item.workstationId || (firstWorkstation ? firstWorkstation.id : null)
        })),
        notes: currentOrderNotes,
        orderType: currentOrderType,
        status: 'completed',
        createdAt: new Date().toISOString(),
        staffName: 'POS Terminal'
      };

      // Only include deliveryInfo for delivery orders
      if (currentOrderType === 'delivery' && currentOrderDeliveryInfo) {
        orderData.deliveryInfo = currentOrderDeliveryInfo;
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to process payment');
      }

      toast.success(t('pos.toast.payment_success_title'), {
        description: t('pos.toast.payment_success_desc'),
        duration: 3000,
      });
      currentOrderClearOrder();
      mutateOrders(); // Refresh orders list
    } catch (error: unknown) {
      toast.error(t('toast.error'), {
        description: error instanceof Error ? error.message : t('pos.toast.send_error'),
        duration: 3000,
      });
    } finally {
      setIsProcessingPayment(false);
    }
  }

  const displayCategories = Array.isArray(categories) ? categories.filter(c => !c.isModifierGroup) : [];
  const displayItems = Array.isArray(categories) && Array.isArray(menuItems) 
    ? menuItems.filter(i => !categories.find(c => c.name === i.category)?.isModifierGroup)
    : [];
  
  const isExistingItem = editingOrderItem ? 
    // We need to access the items from the currentOrder hook
    currentOrderItems.some((i: OrderItem) => i.id === editingOrderItem.id) : false;
  const isDialog = !!editingOrderItem;
  const dialogItem = editingOrderItem?.menuItem;
  
  const closeDialog = () => {
    setEditingOrderItem(null);
  }

  const handleDialogSave = (quantity: number, selectedExtras: MenuItem[], notes: string, workstationId?: string) => {
    if (isDialog && editingOrderItem) {
      if (isExistingItem) {
        handleUpdateItemInOrder(editingOrderItem, quantity, selectedExtras, notes, workstationId);
      } else {
        handleSaveNewItem(quantity, selectedExtras, notes, workstationId);
      }
    }
  }

  return (
    <>
      {isDialog && dialogItem && (
        <AddItemDialog
          isOpen={isDialog}
          onOpenChange={(open) => !open && closeDialog()}
          item={dialogItem}
          orderItem={isExistingItem ? editingOrderItem : null}
          onSave={handleDialogSave}
          onRemove={currentOrderRemoveItem}
          menuItems={safeMenuItems}
          categories={safeCategories}
          workstations={safeWorkstations}
        />
      )}
      
      <PaymentDialogRefactored
        isOpen={isPaymentSheetOpen}
        onOpenChange={setPaymentSheetOpen}
        orderItems={currentOrderItems}
        totalAmount={total}
        onConfirmPayment={handlePaymentSuccess}
        paymentMethods={safePaymentMethods}
      />
      
      <OrderDetailsDialog 
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        order={selectedOrder}
        onViewReceipt={() => {}}
      />
      
      <ReceiptDialog
        isOpen={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        order={selectedOrder}
      />
        
      <div className="flex flex-1 flex-col gap-4 p-1 md:p-1 overflow-hidden md:pt-1 pt-1">
        {(menuItemsError || categoriesError || ordersError || paymentMethodsError || workstationsError) && (
          <Alert variant="destructive" className="mb-1">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('pos.data_error_title')}</AlertTitle>
            <AlertDescription>
              {(menuItemsError?.message || ordersError?.message || paymentMethodsError?.message || categoriesError?.message || workstationsError?.message || '').toString()}
            </AlertDescription>
          </Alert>
        )}
        {/* Order History Button */}
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            className="bg-yellow-500 hover:bg-yellow-600" 
            onClick={() => { 
              console.log('Navigating to orders page');
              router.push('/orders');
            }}
          >
            <History className="h-5 w-5" />
            <span className="ml-2">{t('orders.title')}</span>
          </Button>
        </div>
        
        {/* Menu Items Section */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <MenuSelection 
              menuItems={displayItems}
              categories={displayCategories}
              onAddItem={handleAddItemToOrder}
            />
          </div>
          
          {/* Persistent Cart Column - Made wider for better visibility on all screens */}
          <div className={`flex flex-col h-full transition-all duration-300 ${isCartOpen ? 'w-full md:w-96 lg:w-[32rem] ml-1' : 'w-0 opacity-0'}`}>
            <div className={`flex-1 ${isCartOpen ? 'block' : 'hidden'}`}>
              <SheetCart 
                open={true}
                onOpenChange={setIsCartOpen}
                onSendToKitchen={isEditingOrder ? handleUpdateEditedOrder : handleSendToKitchen}
                onPayment={handleOpenPaymentDialog}
                onEditItem={handleEditItem}
                isEditingOrder={!!isEditingOrder}
              />
            </div>
          </div>
        </div>
        
        {/* Cart Toggle Button - Only show when cart is hidden */}
        {!isCartOpen && (
          <div className="fixed bottom-20 right-6 z-20">
            <Button 
              size="icon" 
              className="rounded-full shadow-lg h-14 w-14 bg-yellow-500 hover:bg-yellow-600"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart className="h-6 w-6" />
              {currentOrderItems.length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 text-xs rounded-full">
                  {currentOrderItems.length}
                </Badge>
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

export default function PosPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PosPageContent />
    </Suspense>
  );
}