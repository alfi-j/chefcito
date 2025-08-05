
"use client"
import React, { useState, useMemo } from 'react';
import { type MenuItem, type OrderItem, type Order } from '@/lib/types';
import { CurrentOrder } from './components/current-order';
import { MenuSelection } from './components/menu-selection';
import { AddItemDialog } from './components/add-item-dialog';
import { PaymentDialog } from './components/payment-dialog';
import { toast } from "sonner";
import { useI18n } from '@/context/i18n-context';
import { addOrder } from '@/lib/mock-data';
import { useMenu } from '@/hooks/use-menu';
import { useCurrentOrder } from '@/hooks/use-current-order';
import { useOrders } from '@/hooks/use-orders';

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
import { MoreHorizontal, File, Search, History } from "lucide-react"
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
import { OrderDetailsDialog } from '../orders/components/order-details-dialog'
import { ReceiptDialog } from '../orders/components/receipt-dialog'
import { getOrderTotal } from '@/lib/utils'

const getStatusVariant = (status: Order['status']) => {
  switch (status) {
    case 'pending':
      return 'secondary'
    case 'completed':
      return 'default'
    default:
      return 'outline'
  }
}


export default function PosPage() {
  const [editingOrderItem, setEditingOrderItem] = useState<OrderItem | null>(null);
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const { t } = useI18n();
  
  const { menuItems, categories, loading: menuLoading, fetchAllData } = useMenu();
  const currentOrder = useCurrentOrder();

  // State and hooks from former OrdersPage
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { orders, loading: ordersLoading, fetchOrders } = useOrders();


  const handleAddItemToOrder = (item: MenuItem) => {
    // Open dialog immediately if item has modifiers
    const hasModifiers = (item.linkedModifiers && item.linkedModifiers.length > 0) || categories.some(c => c.linkedModifiers && c.linkedModifiers.length > 0 && c.name === item.category);

    if (hasModifiers) {
      const newItem: OrderItem = {
          id: `${item.id}-${Date.now()}`,
          menuItem: item,
          quantity: 1,
          cookedCount: 0,
          status: 'New',
          selectedExtras: [],
          notes: '',
      };
      setEditingOrderItem(newItem);
    } else {
       currentOrder.addItem(item, 1, []);
    }
  };
  
  const handleEditItem = (orderItem: OrderItem) => {
    setEditingOrderItem(orderItem);
  };

  const handleUpdateItemInOrder = (item: OrderItem, quantity: number, selectedExtras: MenuItem[], notes: string) => {
     currentOrder.updateItem(item.id, quantity, selectedExtras, notes);
     toast.success(t('pos.toast.item_updated', { item: item.menuItem.name }), { duration: 3000 });
     setEditingOrderItem(null);
  }
  
  const handleSaveNewItem = (quantity: number, selectedExtras: MenuItem[], notes: string) => {
    if (editingOrderItem) {
      currentOrder.addItem(editingOrderItem.menuItem, quantity, selectedExtras, notes);
      setEditingOrderItem(null);
    }
  }

  const handleSendToKitchen = async () => {
    if (currentOrder.items.length === 0) {
      toast.error(t('pos.toast.empty_order_title'), {
        description: t('pos.toast.empty_order_desc'),
        duration: 3000,
      });
      return;
    }

    try {
      await addOrder({
        table: currentOrder.table,
        items: currentOrder.items,
        notes: currentOrder.notes,
        orderType: currentOrder.orderType,
        deliveryInfo: currentOrder.deliveryInfo
      });
      toast.success(t('pos.toast.order_sent_title'), {
        description: t('pos.toast.order_sent_desc'),
        duration: 3000,
      });
      currentOrder.clearOrder();
      fetchOrders(); // Refresh orders list
    } catch (error: any) {
       toast.error(t('toast.error'), {
        description: error.message || t('pos.toast.send_error'),
        duration: 3000,
      });
    }
  };

  const handleOpenPaymentDialog = () => {
    if (currentOrder.items.length === 0) {
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
       await addOrder({
        table: currentOrder.table,
        items: currentOrder.items,
        notes: currentOrder.notes,
        orderType: currentOrder.orderType,
        deliveryInfo: currentOrder.deliveryInfo,
      });
      // In a real app we'd likely mark this new order as paid immediately.
      // For mock purposes, we just add it and then show success.
       toast.success(t('pos.toast.payment_success_title'), {
          description: t('pos.toast.payment_success_desc'),
          duration: 3000,
      });
      currentOrder.clearOrder();
      fetchOrders(); // Refresh orders list
    } catch (error: any) {
       toast.error(t('toast.error'), {
        description: error.message || t('pos.toast.send_error'),
        duration: 3000,
      });
    }
  }

  // Functions from former OrdersPage
  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  }

  const handleViewReceipt = (order: Order) => {
    setSelectedOrder(order);
    setIsReceiptOpen(true);
  }

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    if (activeTab !== 'all') {
      filtered = filtered.filter(order => order.status === activeTab);
    }

    if (searchQuery) {
        filtered = filtered.filter(order => String(order.id).includes(searchQuery));
    }
    
    return filtered.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, activeTab, searchQuery]);
  
  const renderOrders = (orderList: Order[]) => {
    if (ordersLoading) {
      return <div className="flex justify-center items-center h-64"><p>{t('orders.loading')}</p></div>;
    }
    if (orderList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
          <History className="w-16 h-16 mb-4 text-muted-foreground/50"/>
          <p className="font-semibold">{t('orders.no_orders_found')}</p>
          <p className="text-sm">{t('orders.no_orders_description')}</p>
        </div>
      );
    }
    return (
      <>
        {/* Desktop Table View */}
        <div className="hidden md:block border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('orders.table.order_id')}</TableHead>
                <TableHead className="hidden sm:table-cell">{t('orders.table.date')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('orders.table.table')}</TableHead>
                <TableHead className="hidden sm:table-cell">{t('orders.table.status')}</TableHead>
                <TableHead>{t('orders.table.staff')}</TableHead>
                <TableHead className="text-right">{t('orders.table.total')}</TableHead>
                <TableHead><span className="sr-only">{t('orders.table.actions')}</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderList.map((order) => (
                <TableRow key={order.id} className="cursor-pointer" onClick={() => handleViewDetails(order)}>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell className="hidden sm:table-cell">{format(new Date(order.createdAt), 'PPp')}</TableCell>
                  <TableCell className="hidden md:table-cell">{t('pos.current_order.table')} {order.table}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={getStatusVariant(order.status)} className="capitalize">{t(`orders.status.${order.status}`)}</Badge>
                  </TableCell>
                  <TableCell>{order.staffName || 'N/A'}</TableCell>
                  <TableCell className="text-right font-semibold">${getOrderTotal(order).toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">{t('orders.table.toggle_menu')}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuLabel>{t('orders.table.actions')}</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => handleViewDetails(order)}>{t('orders.table.view_details')}</DropdownMenuItem>
                          {order.status === 'completed' && (
                              <DropdownMenuItem onSelect={() => handleViewReceipt(order)}>{t('orders.details.view_receipt')}</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {orderList.map((order) => (
            <Card key={order.id} className="cursor-pointer" onClick={() => handleViewDetails(order)}>
                <CardContent className="p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-bold text-lg">#{order.id}</p>
                            <p className="text-sm text-muted-foreground">{t('pos.current_order.table')} {order.table}</p>
                        </div>
                        <Badge variant={getStatusVariant(order.status)} className="capitalize">{t(`orders.status.${order.status}`)}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                        <p>{format(new Date(order.createdAt), 'PPp')}</p>
                        <p>{t('orders.table.staff')}: {order.staffName || 'N/A'}</p>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                        <p className="text-lg font-bold text-primary">${getOrderTotal(order).toFixed(2)}</p>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleViewDetails(order); }}>
                            {t('orders.table.view_details')}
                        </Button>
                    </div>
                </CardContent>
            </Card>
          ))}
        </div>
      </>
    );
  }
  
  const displayCategories = categories.filter(c => !c.isModifierGroup);
  const displayItems = menuItems.filter(i => !categories.find(c => c.name === i.category)?.isModifierGroup)
  
  const isExistingItem = editingOrderItem ? currentOrder.items.some(i => i.id === editingOrderItem.id) : false;
  const isDialog = !!editingOrderItem;
  const dialogItem = editingOrderItem?.menuItem;
  
  const closeDialog = () => {
    setEditingOrderItem(null);
  }

  const handleDialogSave = (quantity: number, selectedExtras: MenuItem[], notes: string) => {
    if (isDialog && editingOrderItem) {
      if (isExistingItem) {
        handleUpdateItemInOrder(editingOrderItem, quantity, selectedExtras, notes);
      } else {
        handleSaveNewItem(quantity, selectedExtras, notes);
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
          onRemove={currentOrder.removeItem}
          menuItems={menuItems}
          categories={categories}
        />
      )}
      
      <PaymentDialog
        isOpen={isPaymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        orderItems={currentOrder.items}
        totalAmount={currentOrder.total}
        onConfirmPayment={handlePaymentSuccess}
      />
      
      <OrderDetailsDialog 
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        order={selectedOrder}
        onViewReceipt={handleViewReceipt}
      />
      <ReceiptDialog
        isOpen={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        order={selectedOrder}
      />
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-10 gap-4 items-start h-full">
            <div className="md:col-span-6 h-full">
            <MenuSelection menuItems={displayItems} categories={displayCategories} onAddItem={handleAddItemToOrder} />
            </div>
            <div className="md:col-span-4 h-full">
            <CurrentOrder 
                order={currentOrder}
                onSendToKitchen={handleSendToKitchen}
                onPayment={handleOpenPaymentDialog}
                onEditItem={handleEditItem}
            />
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">{t('orders.title')}</CardTitle>
                <CardDescription>{t('orders.description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-4">
                        <TabsList className="grid w-full grid-cols-3 sm:w-auto">
                            <TabsTrigger value="all">{t('orders.tabs.all')}</TabsTrigger>
                            <TabsTrigger value="pending">{t('orders.tabs.pending')}</TabsTrigger>
                            <TabsTrigger value="completed">{t('orders.tabs.completed')}</TabsTrigger>
                        </TabsList>
                        <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder={t('orders.table.order_id')}
                            className="pl-8 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        </div>
                    </div>
                    <TabsContent value="all">{renderOrders(filteredOrders)}</TabsContent>
                    <TabsContent value="pending">{renderOrders(filteredOrders)}</TabsContent>
                    <TabsContent value="completed">{renderOrders(filteredOrders)}</TabsContent>
                </Tabs>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
