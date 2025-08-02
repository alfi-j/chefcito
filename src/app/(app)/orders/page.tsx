
"use client"

import React, { useState, useMemo } from 'react'
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
import { type Order, type OrderItem } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useI18n } from '@/context/i18n-context'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useOrders } from '@/hooks/use-orders'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { OrderDetailsDialog } from './components/order-details-dialog'
import { ReceiptDialog } from './components/receipt-dialog'

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

export const getOrderTotal = (order: Order) => {
    return order.items.reduce((total, item) => {
        const extrasTotal = item.selectedExtras?.reduce((acc, extra) => acc + extra.price, 0) || 0;
        const totalUnits = (item.cookedCount || 0) + (item.quantity || 0);
        const mainItemPrice = item.menuItem.price + extrasTotal;
        return total + (mainItemPrice * totalUnits);
    }, 0);
};

export const getItemTotal = (item: OrderItem) => {
    const extrasPrice = item.selectedExtras?.reduce((acc, extra) => acc + extra.price, 0) || 0;
    const totalUnits = (item.cookedCount || 0) + (item.quantity || 0);
    return (item.menuItem.price + extrasPrice) * totalUnits;
};


export default function OrdersPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { orders, loading } = useOrders();

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
    if (loading) {
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

  return (
    <>
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
    </>
  );
}
