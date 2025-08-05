
"use client";
import { useState, useMemo, type DragEvent } from "react";
import { OrderCard } from "./components/order-card";
import { type Order } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card";
import { useI18n } from "@/context/i18n-context";
import { useOrders } from "@/hooks/use-orders";


export default function KdsPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [draggedOrderId, setDraggedOrderId] = useState<number | null>(null);
  const [dragOverOrderId, setDragOverOrderId] = useState<number | null>(null);
  const { t } = useI18n();
  
  const { 
    orders, 
    setOrders,
    loading, 
    updateItemStatus, 
    revertItemStatus, 
    togglePinOrder 
  } = useOrders();

  const handleDragStart = (e: DragEvent<HTMLDivElement>, orderId: number) => {
    setDraggedOrderId(orderId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedOrderId(null);
    setDragOverOrderId(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, dropOrderId: number) => {
    e.preventDefault();
    if (draggedOrderId === null || draggedOrderId === dropOrderId) {
      handleDragEnd();
      return;
    }

    setOrders(currentOrders => {
        const pending = currentOrders.filter(o => o.status === 'pending' && !o.isPinned);
        const pinned = currentOrders.filter(o => o.status === 'pending' && o.isPinned);
        const completed = currentOrders.filter(o => o.status === 'completed');

        const fromIndex = pending.findIndex(o => o.id === draggedOrderId);
        const toIndex = pending.findIndex(o => o.id === dropOrderId);

        if (fromIndex === -1 || toIndex === -1) {
          handleDragEnd();
          return currentOrders;
        }
        
        const reorderedPending = [...pending];
        const [removed] = reorderedPending.splice(fromIndex, 1);
        reorderedPending.splice(toIndex, 0, removed);
      
        return [...pinned, ...reorderedPending, ...completed];
    });

    handleDragEnd();
  };
  
  const handleDragEnter = (e: DragEvent<HTMLDivElement>, orderId: number) => {
    e.preventDefault();
    if (draggedOrderId !== orderId) {
      const draggedOrder = orders.find(o => o.id === draggedOrderId);
      if (draggedOrder && !draggedOrder.isPinned) {
        setDragOverOrderId(orderId);
      }
    }
  };

  const kitchenOrders = useMemo(() => {
    const pending = orders.filter(o => o.status === 'pending');
    const unpinned = pending.filter(o => !o.isPinned);
    const pinned = pending.filter(o => o.isPinned).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return [...pinned, ...unpinned];
  }, [orders]);

  const servingOrders = useMemo(() => {
      return orders.filter(o => o.status === 'completed').sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
            onUpdateItemStatus={updateItemStatus}
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
