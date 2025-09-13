"use client"

import React, { useState } from 'react';
import { Card } from "@/components/ui/card"
import { OrderCard } from './components/order-card';
import { useOrders } from '@/hooks/use-orders';
import { useI18n } from '@/context/i18n-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMemo } from 'react';
import { type Order } from '@/lib/types';

export default function KDSPage() {
  const { orders, loading, updateItemStatus, revertItemStatus, togglePinOrder } = useOrders();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('pending');
  const [draggedOrderId, setDraggedOrderId] = useState<number | null>(null);
  const [dragOverOrderId, setDragOverOrderId] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, orderId: number) => {
    setDraggedOrderId(orderId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, orderId: number) => {
    e.preventDefault();
    setDragOverOrderId(orderId);
  };

  const handleDragEnd = () => {
    setDraggedOrderId(null);
    setDragOverOrderId(null);
  };

  const handleDrop = (e: React.DragEvent, targetOrderId: number) => {
    e.preventDefault();
    setDragOverOrderId(null);
    
    if (draggedOrderId && draggedOrderId !== targetOrderId) {
      // Handle order reordering if needed
      console.log(`Dropped order ${draggedOrderId} onto order ${targetOrderId}`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const kitchenOrders = useMemo(() => {
    const pending = orders.filter(o => 
      o.items.some(i => i.newCount > 0 || i.cookingCount > 0) &&
      !o.items.some(i => i.readyCount > 0 || i.servedCount > 0)
    );
    
    const unpinned = pending.filter(o => !o.isPinned);
    const pinned = pending.filter(o => o.isPinned).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    return [...pinned, ...unpinned];
  }, [orders]);

  const servingOrders = useMemo(() => {
    const completed = orders
      .filter(o => o.items.some(i => i.readyCount > 0 || i.servedCount > 0))
      .map(o => ({
        ...o,
        items: o.items.filter(i => i.readyCount > 0 || i.servedCount > 0)
      }));
    
    const unpinned = completed.filter(o => !o.isPinned);
    const pinned = completed.filter(o => o.isPinned).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    return [...pinned, ...unpinned];
  }, [orders]);

  
  const renderOrderList = (orderList: Order[]) => {
    if (loading) {
        return <div className="flex justify-center items-center h-[calc(100vh-200px)]"><p>{t('kds.loading')}</p></div>
    }
    if (orderList.length === 0) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-200px)] text-muted-foreground">
          <p>{t('kds.no_orders')}</p>
        </div>
      );
    }
    return (
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 items-start" onDragEnd={handleDragEnd}>
        {orderList.map((order) => (
          <OrderCard 
            key={order.id}
            order={order}
            items={order.items}
            onUpdateItemStatus={(orderId, itemId, newStatus) => {
              // Map the status values to match the API
              const statusMap: Record<string, 'cooking' | 'ready' | 'served'> = {
                'Cooking': 'cooking',
                'Ready': 'ready',
                'Served': 'served'
              };
              const apiStatus = statusMap[newStatus];
              if (apiStatus) {
                updateItemStatus({ orderId, itemId, newStatus: apiStatus });
              }
            }}
            onRevertItemStatus={revertItemStatus}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onDragEnter={handleDragEnter}
            isDraggingOver={dragOverOrderId === order.id}
            onTogglePin={togglePinOrder}
          />
        ))}
      </div>
    );
  };

  return (
    <Card>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="p-4 sm:p-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">{t('kds.tabs.kitchen')} ({kitchenOrders.length})</TabsTrigger>
          <TabsTrigger value="completed">{t('kds.tabs.serving')} ({servingOrders.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="pt-4 sm:pt-6">
          {renderOrderList(kitchenOrders)}
        </TabsContent>
        <TabsContent value="completed" className="pt-4 sm:pt-6">
          {renderOrderList(servingOrders)}
        </TabsContent>
      </Tabs>
    </Card>
  );
}