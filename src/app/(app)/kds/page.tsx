
"use client";
import { useState, useEffect, useCallback, useMemo, type DragEvent } from "react";
import { OrderCard } from "./components/order-card";
import { initialOrders, type Order } from "@/lib/data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card";

const isOrderCompleted = (order: Order) => order.items.every(item => item.quantity === 0);

const statusSequence: ('New' | 'Cooking' | 'Cooked')[] = ['New', 'Cooking', 'Cooked'];

export default function KdsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState('pending');

  const [draggedOrderId, setDraggedOrderId] = useState<number | null>(null);
  const [dragOverOrderId, setDragOverOrderId] = useState<number | null>(null);

  useEffect(() => {
    // Initial sort can be based on creation time, but pinned status will override it.
    const sortedInitialOrders = [...initialOrders].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return a.createdAt.getTime() - b.createdAt.getTime();
    });
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

        const draggedOrder = pending.find(o => o.id === draggedOrderId);
        if (!draggedOrder || draggedOrder.isPinned) {
            // Cannot reorder pinned items this way
             setDraggedOrderId(null);
             setDragOverOrderId(null);
            return currentOrders;
        }

        let newPending = pending.filter(o => o.id !== draggedOrderId);
        const dropIndex = newPending.findIndex(o => o.id === dropOrderId);

        if (dropIndex === -1) return currentOrders;

        newPending.splice(dropIndex, 0, draggedOrder);
      
        return [...newPending, ...completed];
    });

    setDraggedOrderId(null);
    setDragOverOrderId(null);
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

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const togglePinOrder = useCallback((orderId: number) => {
    setOrders(currentOrders => {
      const orderToToggle = currentOrders.find(o => o.id === orderId);
      if (!orderToToggle) return currentOrders;
      
      const updatedOrder = { ...orderToToggle, isPinned: !orderToToggle.isPinned };
      
      const otherOrders = currentOrders.filter(o => o.id !== orderId);
      const newOrders = [...otherOrders, updatedOrder];

      // Re-sort the array: Pinned first, then by creation date.
      return newOrders.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        // if both are pinned or both unpinned, sort by original index or time
        const pendingA = orders.find(o => o.id === a.id);
        const pendingB = orders.find(o => o.id === b.id);
        if(pendingA && pendingB && !a.isPinned && !b.isPinned) {
            return pendingA.createdAt.getTime() - pendingB.createdAt.getTime();
        }
        return 0;
      });
    });
  }, [orders]);


  const pendingOrders = useMemo(() => {
      const pending = orders.filter(o => o.status === 'pending');
      const pinned = pending.filter(o => o.isPinned);
      const unpinned = pending.filter(o => !o.isPinned);
      return [...pinned, ...unpinned];
  }, [orders]);

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
      <div className="flex flex-wrap gap-2 items-start">
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
            onTogglePin={togglePinOrder}
          />
        ))}
      </div>
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
