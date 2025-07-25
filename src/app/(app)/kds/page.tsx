
"use client";
import { useState, useEffect, useCallback, useMemo, type DragEvent } from "react";
import { OrderCard } from "./components/order-card";
import { type Order } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card";
import { getOrders, updateOrderItemStatus, updateOrderStatus, toggleOrderPin } from "@/lib/dataService";
import { useToast } from "@/hooks/use-toast";

const isOrderCompleted = (order: Order) => order.items.every(item => item.quantity === 0 && item.cookedCount > 0);

const statusSequence: ('New' | 'Cooking' | 'Cooked')[] = ['New', 'Cooking', 'Cooked'];

export default function KdsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [draggedOrderId, setDraggedOrderId] = useState<number | null>(null);
  const [dragOverOrderId, setDragOverOrderId] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    try {
      const fetchedOrders = await getOrders();
      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast({ title: "Error", description: "Could not fetch orders.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Poll for new orders every 5 seconds
    return () => clearInterval(interval);
  }, [fetchOrders]);
  
  const updateItemStatus = useCallback(async (orderId: number, itemId: string) => {
    setOrders(currentOrders => {
        const newOrders = currentOrders.map(o => {
            if (o.id !== orderId) return o;
            const newItems = o.items.map(i => {
                if (i.id !== itemId || i.status === 'Cooked') return i;

                const currentIndex = statusSequence.indexOf(i.status);
                const nextStatus = statusSequence[currentIndex + 1];

                if (nextStatus === 'Cooked') {
                    const newQuantity = i.quantity - 1;
                    const newCookedCount = i.cookedCount + 1;
                    const statusForRemaining = newQuantity > 0 ? 'New' : 'Cooked';
                    updateOrderItemStatus(orderId, itemId, statusForRemaining, newQuantity, newCookedCount).then(success => {
                        if (success) fetchOrders();
                        else toast({ title: "Error", description: "Failed to update item status.", variant: "destructive" });
                    });
                    return { ...i, quantity: newQuantity, cookedCount: newCookedCount, status: statusForRemaining };
                } else {
                     updateOrderItemStatus(orderId, itemId, nextStatus, i.quantity, i.cookedCount).then(success => {
                        if (success) fetchOrders();
                        else toast({ title: "Error", description: "Failed to update item status.", variant: "destructive" });
                    });
                    return { ...i, status: nextStatus };
                }
            });
            const updatedOrder = { ...o, items: newItems };
            if (isOrderCompleted(updatedOrder)) {
                updateOrderStatus(orderId, 'completed').then(success => {
                    if (success) fetchOrders();
                });
            }
            return updatedOrder;
        });
        return newOrders;
    });
  }, [fetchOrders, toast]);


  const revertItemStatus = useCallback(async (orderId: number, itemId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const item = order.items.find(i => i.id === itemId);
    if (!item || item.cookedCount <= 0) return;

    const newQuantity = item.quantity + 1;
    const newCookedCount = item.cookedCount - 1;

    const success = await updateOrderItemStatus(orderId, itemId, 'New', newQuantity, newCookedCount);
    if (success) {
      if (order.status === 'completed') {
        await updateOrderStatus(orderId, 'pending');
      }
      await fetchOrders();
    } else {
      toast({ title: "Error", description: "Failed to revert item status.", variant: "destructive" });
    }
  }, [orders, toast, fetchOrders]);
  
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
            setDraggedOrderId(null);
            setDragOverOrderId(null);
            return currentOrders;
        }

        const otherOrders = pending.filter(o => o.id !== draggedOrderId);
        const dropIndex = otherOrders.findIndex(o => o.id === dropOrderId);

        if (dropIndex === -1) return currentOrders;

        otherOrders.splice(dropIndex, 0, draggedOrder);
      
        return [...otherOrders, ...completed];
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
    setDragOverOrderId(null);
  };

  const togglePinOrder = useCallback(async (orderId: number) => {
    const orderToToggle = orders.find(o => o.id === orderId);
    if (!orderToToggle) return;
    
    const newPinState = !orderToToggle.isPinned;
    const success = await toggleOrderPin(orderId, newPinState);
    if(success) {
      await fetchOrders();
    } else {
       toast({ title: "Error", description: "Failed to update pin status.", variant: "destructive" });
    }
  }, [orders, toast, fetchOrders]);

  const pendingOrders = useMemo(() => {
    const pending = orders.filter(o => o.status === 'pending');
    // Ensure chronological sort for unpinned items before applying drag-and-drop
    const unpinned = pending.filter(o => !o.isPinned).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const pinned = pending.filter(o => o.isPinned).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return [...pinned, ...unpinned];
  }, [orders]);

  const completedOrders = useMemo(() => {
      return orders.filter(o => o.status === 'completed').sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [orders]);
  
  const renderOrderList = (orderList: Order[]) => {
    if (loading) {
        return <div className="flex justify-center items-center h-[calc(100vh-200px)]"><p>Loading orders...</p></div>
    }
    if (orderList.length === 0) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-200px)] text-muted-foreground">
          <p>No orders in this category.</p>
        </div>
      );
    }
    return (
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 items-start">
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
