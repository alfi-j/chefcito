"use client"
import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { type MenuItem, type OrderItem, type Order, type Payment } from '@/lib/types';
import { CurrentOrder } from './components/current-order';
import { MenuSelection } from './components/menu-selection';
import { AddItemDialog } from './components/add-item-dialog';
import { PaymentDialog } from './components/payment-dialog';
import { SheetCart } from './components/sheet-cart';
import { toast } from "sonner";
import { useI18nStore } from '@/lib/stores/i18n-store';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, File, Search, History, Settings, Home, ClipboardList, Users, BarChart, ShoppingCart, ChefHat } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { ReceiptDialog } from './components/dialogs/receipt-dialog'
import { OrderDetailsDialog } from './components/dialogs/order-details-dialog'
import { getOrderTotal } from '@/lib/utils'
import { useCallback } from 'react'
import { type Category } from '@/lib/types'
import { useCurrentOrderStore, useCurrentOrderTotals, useCurrentOrderItemCountByCategory } from '@/lib/stores/current-order-store';
import { fetcher } from '@/lib/swr-fetcher';

function PosPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [editingOrderItem, setEditingOrderItem] = useState<OrderItem | null>(null);
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [isEditingOrder, setIsEditingOrder] = useState<Order | null>(null);
  
  const { t } = useI18nStore();
  
  // SWR data fetching
  const { data: menuItems = [], error: menuItemsError, isLoading: isLoadingMenu, mutate: mutateMenuItems } = useSWR<MenuItem[]>('/api/menu', fetcher, {
    fallbackData: [],
  });
  
  const { data: categories = [], error: categoriesError, isLoading: isLoadingCategories, mutate: mutateCategories } = useSWR<Category[]>('/api/categories', fetcher, {
    fallbackData: [],
  });
  
  const { data: workstations = [], error: workstationsError, isLoading: isLoadingWorkstations, mutate: mutateWorkstations } = useSWR<any[]>('/api/workstations', fetcher, {
    fallbackData: [],
  });
  
  const { data: orders = [], error: ordersError, isLoading: isLoadingOrders, mutate: mutateOrders } = useSWR<Order[]>('/api/orders', fetcher, {
    fallbackData: [],
    revalidateOnMount: true,
    shouldRetryOnError: true
  });
  
  const { data: paymentMethods = [], error: paymentMethodsError, isLoading: isLoadingPayments, mutate: mutatePayments } = useSWR<Payment[]>(
    '/api/payments',
    fetcher,
    {
      fallbackData: [],
      revalidateOnMount: true,
      shouldRetryOnError: true
    }
  );
  
  // Zustand store
  const currentOrderItems = useCurrentOrderStore(state => state.items);
  const currentOrderTable = useCurrentOrderStore(state => state.table);
  const currentOrderNotes = useCurrentOrderStore(state => state.notes);
  const currentOrderType = useCurrentOrderStore(state => state.orderType);
  const currentOrderDeliveryInfo = useCurrentOrderStore(state => state.deliveryInfo);
  const currentOrderSetTable = useCurrentOrderStore(state => state.setTable);
  const currentOrderSetNotes = useCurrentOrderStore(state => state.setNotes);
  const currentOrderSetOrderType = useCurrentOrderStore(state => state.setOrderType);
  const currentOrderSetDeliveryInfo = useCurrentOrderStore(state => state.setDeliveryInfo);
  const currentOrderAddItem = useCurrentOrderStore(state => state.addItem);
  const currentOrderUpdateItem = useCurrentOrderStore(state => state.updateItem);
  const currentOrderRemoveItem = useCurrentOrderStore(state => state.removeItem);
  const currentOrderClearOrder = useCurrentOrderStore(state => state.clearOrder);
  const currentOrderUpdateItemQuantity = useCurrentOrderStore(state => state.updateItemQuantity);
  
  // Computed values from Zustand
  const { subtotal, tax, total } = useCurrentOrderTotals();
  const itemCountByCategory = useCurrentOrderItemCountByCategory();

  // Check for editOrder parameter and load the order
  useEffect(() => {
    const editOrderId = searchParams?.get('editOrder');
    if (editOrderId && orders && orders.length > 0) {
      const orderToEdit = orders.find(order => order.id === parseInt(editOrderId));
      if (orderToEdit) {
        handleEditOrder(orderToEdit);
        setIsEditingOrder(orderToEdit);
        setIsCartOpen(true); // Automatically open the cart when editing an order
        
        // Remove the query parameter from the URL
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('editOrder');
        router.replace(`/pos?${newSearchParams.toString()}`, { scroll: false });
      }
    }
 }, [searchParams, orders]);
  
  // Combine loading states
  const loading = isLoadingMenu || isLoadingCategories;
  
  // Make sure we have default values
  const safeMenuItems = menuItems || [];
  const safeCategories = categories || [];
  const safePaymentMethods = paymentMethods || [];
  const safeWorkstations = workstations || [];
  
  // Fetch all data function for refresh
  const fetchAllData = useCallback(() => {
    // Individual hooks handle their own data fetching
  }, []);

  // If you need to add an order with SWR
  const addOrder = async (order: Order) => {
    try {
      const response = await fetch('/api/orders/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add order');
      }
      
      // SWR will automatically revalidate and update the orders list
      mutateOrders();
      return await response.json();
    } catch (error) {
      console.error('Error adding order:', error);
      throw error;
    }
  };

  const handleEditOrder = (order: Order) => {
    // Clear current order first
    currentOrderClearOrder();
    
    // Add each item from the selected order to the current order
    order.items.forEach(item => {
      const orderItem: any = {
        ...item,
        id: `${Date.now()}-${Math.random()}`, // Generate new ID for the order item
        menuItemId: item.menuItem.id,
      };
      currentOrderAddItem(orderItem, item.quantity, item.selectedExtras || [], item.notes, item.workstationId);
    });
    
    // Set other order properties
    if (order.orderType === 'delivery' && order.deliveryInfo) {
      currentOrderSetDeliveryInfo(order.deliveryInfo);
    }
    currentOrderSetOrderType(order.orderType);
    currentOrderSetTable(order.table);
    currentOrderSetNotes(order.notes || '');
  };

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
        restaurantId: 'restaurant-1', // Add restaurantId to ensure validation passes
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
    } catch (error: any) {
      toast.error(t('toast.error'), {
        description: error.message || t('orders.toast.update_error'),
        duration: 3000,
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditingOrder(null);
    currentOrderClearOrder();
    
    toast.info(t('orders.toast.edit_cancelled'), {
      duration: 3000,
    });
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

    try {
      // Prepare order data based on order type
      const orderData: any = {
        table: currentOrderTable,
        items: currentOrderItems.map(item => {
          console.log('Sending item to kitchen:', item);
          return {
            id: item.id,
            menuItemId: item.menuItem.id,
            name: item.menuItem.name,
            price: item.menuItem.price,
            quantity: item.quantity,
            selectedExtraIds: item.selectedExtras?.map((extra: any) => extra.id) || [],
            notes: item.notes || '',
            // Initialize status for KDS tracking
            status: 'new',
            workstationId: item.workstationId || null
          };
        }),
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
    } catch (error: any) {
       toast.error(t('toast.error'), {
        description: error.message || t('pos.toast.send_error'),
        duration: 5000,
      });
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
    setPaymentDialogOpen(true);
  }

  const handlePaymentSuccess = async () => {
    setPaymentDialogOpen(false);
    
    // Send order as completed
    try {
      // Prepare order data based on order type
      const orderData: any = {
        table: currentOrderTable,
        items: currentOrderItems.map(item => ({
          id: item.id,
          menuItemId: item.menuItem.id,
          name: item.menuItem.name,
          price: item.menuItem.price,
          quantity: item.quantity,
          selectedExtraIds: item.selectedExtras?.map((extra: any) => extra.id) || [],
          notes: item.notes || '',
          // For completed orders, mark all as served
          status: 'served',
          workstationId: item.workstationId || null
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
    } catch (error: any) {
      toast.error(t('toast.error'), {
        description: error.message || t('pos.toast.send_error'),
        duration: 3000,
      });
    }
  }

  const displayCategories = Array.isArray(categories) ? categories.filter(c => !c.isModifierGroup) : [];
  const displayItems = Array.isArray(categories) && Array.isArray(menuItems) 
    ? menuItems.filter(i => !categories.find(c => c.name === i.category)?.isModifierGroup)
    : [];
  
  const isExistingItem = editingOrderItem ? 
    // We need to access the items from the currentOrder hook
    currentOrderItems.some(i => i.id === editingOrderItem.id) : false;
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

  // Create a currentOrder object that mimics the hook's return value for compatibility
  const currentOrder = {
    items: currentOrderItems,
    table: currentOrderTable,
    setTable: (value: any) => {
      if (typeof value === 'function') {
        // Handle React's setState function form
        const newValue = value(currentOrderTable);
        currentOrderSetTable(newValue);
      } else {
        // Handle direct value
        currentOrderSetTable(value);
      }
    },
    notes: currentOrderNotes,
    setNotes: (value: any) => {
      if (typeof value === 'function') {
        // Handle React's setState function form
        const newValue = value(currentOrderNotes);
        currentOrderSetNotes(newValue);
      } else {
        // Handle direct value
        currentOrderSetNotes(value);
      }
    },
    orderType: currentOrderType,
    setOrderType: (value: any) => {
      if (typeof value === 'function') {
        // Handle React's setState function form
        const newValue = value(currentOrderType);
        currentOrderSetOrderType(newValue);
      } else {
        // Handle direct value
        currentOrderSetOrderType(value);
      }
    },
    deliveryInfo: currentOrderDeliveryInfo,
    setDeliveryInfo: (value: any) => {
      if (typeof value === 'function') {
        // Handle React's setState function form
        const newValue = value(currentOrderDeliveryInfo);
        currentOrderSetDeliveryInfo(newValue);
      } else {
        // Handle direct value
        currentOrderSetDeliveryInfo(value);
      }
    },
    addItem: currentOrderAddItem,
    updateItem: currentOrderUpdateItem,
    removeItem: currentOrderRemoveItem,
    clearOrder: currentOrderClearOrder,
    updateItemQuantity: currentOrderUpdateItemQuantity,
    subtotal,
    tax,
    total,
    itemCountByCategory
  };

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
      
      <PaymentDialog
        isOpen={isPaymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
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
        
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 overflow-hidden md:pt-6 pt-4">
        {/* Order History Button and Cart Button */}
        <div className="flex justify-end">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => { 
              console.log('Navigating to orders page');
              router.push('/orders');
            }}>
              <History className="h-5 w-5" />
            </Button>
            <SheetCart 
              open={isCartOpen}
              onOpenChange={setIsCartOpen}
              onSendToKitchen={isEditingOrder ? handleUpdateEditedOrder : handleSendToKitchen}
              onPayment={handleOpenPaymentDialog}
              onEditItem={handleEditItem}
            />
          </div>
        </div>
        
        {/* Menu Items Section */}
        <div className="flex-1 overflow-hidden">
          <MenuSelection 
            menuItems={displayItems}
            categories={displayCategories}
            onAddItem={handleAddItemToOrder}
          />
        </div>
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