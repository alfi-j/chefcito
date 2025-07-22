
"use client";
import { useState, useEffect, useCallback, useMemo, type DragEvent } from "react";
import { OrderCard } from "./components/order-card";
import { initialOrders, type Order } from "@/lib/data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card";
import Masonry from 'react-masonry-css';

const isOrderCompleted = (order: Order) => order.items.every(item => item.quantity === 0);

const statusSequence: ('New' | 'Cooking' | 'Cooked')[] = ['New', 'Cooking', 'Cooked'];

const breakpointColumnsObj = {
  default: 5,
  1920: 5, // 3xl
  1536: 4, // 2xl
  1280: 3, // xl
  1024: 2, // lg
  768: 1   // md
};


export default function KdsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState('pending');

  const [draggedOrderId, setDraggedOrderId] = useState<number | null>(null);
  const [dragOverOrderId, setDragOverOrderId] = useState<number | null>(null);

  useEffect(() => {
    const sortedInitialOrders = [...initialOrders].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    setOrders(sortedInitialOrders);
  }, []);

  const updateItemStatus = useCallback((orderId: number, itemId: string) => {
    setOrders(currentOrders => currentOrders.map(order => {
      if (order.id !== orderId) return order;

      const updatedItems = order.items.map(item => {
        if (item.id !== itemId || item.status === 'Cooked') return item;

        const currentIndex = statusSequence.indexOf(item.status);
        const nextStatus = statusSequence[currentIndex + 1];

        if (nextStatus === 'Cooked') {
          const newQuantity = item.quantity - 1;
          const newCookedCount = item.cookedCount + 1;
          const newStatus = newQuantity > 0 ? 'New' : 'Cooked';
          return { ...item, quantity: newQuantity, cookedCount: newCookedCount, status: newStatus };
        }
        
        return { ...item, status: nextStatus };
      });
      
      const newOrder = { ...order, items: updatedItems };
      newOrder.status = isOrderCompleted(newOrder) ? 'completed' : 'pending';
      return newOrder;
    }));
  }, []);

  const revertItemStatus = useCallback((orderId: number, itemId: string) => {
    setOrders(currentOrders => currentOrders.map(order => {
      if (order.id !== orderId) return order;
      
      const updatedItems = order.items.map(item => {
        if (item.id === itemId && item.cookedCount > 0) {
          return {
            ...item,
            quantity: item.quantity + 1,
            cookedCount: item.cookedCount - 1,
            status: 'New'
          };
        }
        return item;
      });

      const newOrder = { ...order, items: updatedItems };
      newOrder.status = isOrderCompleted(newOrder) ? 'completed' : 'pending';
      return newOrder;
    }));
  }, []);
  
  const handleDragStart = (e: DragEvent<HTMLDivElement>, orderId: number) => {
    setDraggedOrderId(orderId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, dropOrderId: number) => {
    e.preventDefault();
    if (draggedOrderId === null || draggedOrderId === dropOrderId) {
      setDraggedOrderId(null);
      setDragOverOrderId(null);
      return;
    }
    
    setOrders(currentOrders => {
      const pending = currentOrders.filter(o => o.status === 'pending');
      const completed = currentOrders.filter(o => o.status === 'completed');

      const draggedIndex = pending.findIndex(o => o.id === draggedOrderId);
      const dropIndex = pending.findIndex(o => o.id === dropOrderId);

      if (draggedIndex === -1 || dropIndex === -1) return currentOrders;

      const newPending = [...pending];
      const [draggedOrder] = newPending.splice(draggedIndex, 1);
      newPending.splice(dropIndex, 0, draggedOrder);
      
      return [...newPending, ...completed];
    });

    setDraggedOrderId(null);
    setDragOverOrderId(null);
  };
  
  const handleDragEnter = (e: DragEvent<HTMLDivElement>, orderId: number) => {
    e.preventDefault();
    if (draggedOrderId !== orderId) {
      setDragOverOrderId(orderId);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };


  const pendingOrders = useMemo(() => orders.filter(o => o.status === 'pending'), [orders]);
  const completedOrders = useMemo(() => orders.filter(o => o.status === 'completed'), [orders]);
  
  const renderOrderList = (orderList: Order[]) => {
    if (orderList.length === 0) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-200px)] text-muted-foreground">
          <p>No orders in this category.</p>
        </div>
      );
    }
    return (
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex w-auto -ml-2"
        columnClassName="pl-2 bg-clip-padding"
      >
        {orderList.map((order) => (
          <OrderCard 
            key={order.id}
            order={order} 
            onUpdateItemStatus={updateItemStatus}
            onRevertItemStatus={revertItemStatus}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            isDraggingOver={dragOverOrderId === order.id}
          />
        ))}
      </Masonry>
    );
  };

  return (
    <Card>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="p-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pending ({pendingOrders.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedOrders.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="pt-4">
          {renderOrderList(pendingOrders)}
        </TabsContent>
        <TabsContent value="completed" className="pt-4">
          {renderOrderList(completedOrders)}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
