
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
import { type Order } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useI18n } from '@/context/i18n-context'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useOrderHistory } from '@/hooks/use-order-history'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { OrderDetailsDialog } from './components/order-details-dialog'

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
        // Correctly calculate total price for all units of the item, including its own quantity and any already cooked.
        const totalUnits = (item.cookedCount || 0) + (item.quantity || 0);
        const mainItemPrice = item.menuItem.price + extrasTotal;
        return total + (mainItemPrice * totalUnits);
    }, 0);
};


export default function OrdersPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('all');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { orders, loading } = useOrderHistory();

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  }

  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') return orders;
    return orders.filter(order => order.status === activeTab);
  }, [orders, activeTab]);
  
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
      <div className="border rounded-lg">
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <>
      <OrderDetailsDialog 
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        order={selectedOrder}
      />
      <Card>
          <CardHeader>
              <CardTitle className="font-headline">{t('orders.title')}</CardTitle>
              <CardDescription>{t('orders.description')}</CardDescription>
          </CardHeader>
          <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="all">{t('orders.tabs.all')}</TabsTrigger>
                  <TabsTrigger value="pending">{t('orders.tabs.pending')}</TabsTrigger>
                  <TabsTrigger value="completed">{t('orders.tabs.completed')}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="all">{renderOrders(filteredOrders)}</TabsContent>
                  <TabsContent value="pending">{renderOrders(filteredOrders)}</TabsContent>
                  <TabsContent value="completed">{renderOrders(filteredOrders)}</TabsContent>
              </Tabs>
          </CardContent>
      </Card>
    </>
  );
}
