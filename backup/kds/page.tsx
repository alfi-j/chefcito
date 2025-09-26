
"use client";
import { useState, useMemo, type DragEvent } from "react";
import { OrderCard } from "./components/order-card";
import { type Order, type OrderItem } from "@/lib/types";
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

    const draggedOrder = orders.find(o => o.id === draggedOrderId);
    const dropOrder = orders.find(o => o.id === dropOrderId);

    if (!draggedOrder || !dropOrder) {
      handleDragEnd();
      return;
    }
    
    // Determine which list we are in based on activeTab
    const orderList = activeTab === 'pending' ? kitchenOrders : servingOrders;
    
    const fromIndex = orderList.findIndex(o => o.id === draggedOrderId);
    const toIndex = orderList.findIndex(o => o.id === dropOrderId);

    if (fromIndex === -1 || toIndex === -1) {
       handleDragEnd();
       return;
    }

    setOrders(currentOrders => {
        const reordered = [...currentOrders];
        const fromOrderIndex = reordered.findIndex(o => o.id === draggedOrderId);
        const toOrderIndex = reordered.findIndex(o => o.id === dropOrderId);
        
        const [removed] = reordered.splice(fromOrderIndex, 1);
        reordered.splice(toOrderIndex, 0, removed);
        
        return reordered;
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
    const pending = orders
      .filter(o => o.items.some(i => i.newCount > 0 || i.cookingCount > 0))
      .map(o => ({
        ...o,
        items: o.items.filter(i => i.newCount > 0 || i.cookingCount > 0)
      }));

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
