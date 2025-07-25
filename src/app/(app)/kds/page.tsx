
"use client";
import { useState, useEffect, useCallback, useMemo, type DragEvent } from "react";
import { OrderCard } from "./components/order-card";
import { type Order } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card";
import { getOrders, updateOrderItemStatus, updateOrderStatus, toggleOrderPin } from "@/lib/dataService";
import { useToast } from "@/hooks/use-toast";

const isOrderCompleted = (order: Order) => order.items.every(item => item.quantity === 0);

const statusSequence: ('New' | 'Cooking' | 'Cooked')[] = ['New', 'Cooking', 'Cooked'];

export default function KdsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [draggedOrderId, setDraggedOrderId] = useState<number | null>(null);
  const [dragOverOrderId, setDragOverOrderId] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    const fetchedOrders = await getOrders();
    const sortedOrders = fetchedOrders.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return a.createdAt.getTime() - b.createdAt.getTime();
    });
    setOrders(sortedOrders);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Poll for new orders every 5 seconds
    return () => clearInterval(interval);
  }, [fetchOrders]);
  
  const updateItemStatus = useCallback(async (orderId: number, itemId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const item = order.items.find(i => i.id === itemId);
    if (!item || item.status === 'Cooked') return;

    const currentIndex = statusSequence.indexOf(item.status);
    const nextStatus = statusSequence[currentIndex + 1];
    
    let newQuantity = item.quantity;
    let newCookedCount = item.cookedCount;
    let newStatus = nextStatus;

    if (nextStatus === 'Cooked') {
      newQuantity = item.quantity - 1;
      newCookedCount = item.cookedCount + 1;
      newStatus = newQuantity > 0 ? 'New' : 'Cooked';
    }

    const success = await updateOrderItemStatus(orderId, itemId, newStatus, newQuantity, newCookedCount);
    if (success) {
       await fetchOrders(); // Refetch to get the latest state
       const updatedOrder = orders.find(o => o.id === orderId);
       if (updatedOrder && isOrderCompleted(updatedOrder)) {
         await updateOrderStatus(orderId, 'completed');
         await fetchOrders();
       }
    } else {
      toast({ title: "Error", description: "Failed to update item status.", variant: "destructive" });
    }
  }, [orders, fetchOrders, toast]);

  const revertItemStatus = useCallback(async (orderId: number, itemId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const item = order.items.find(i => i.id === itemId);
    if (!item || item.cookedCount <= 0) return;

    const newQuantity = item.quantity + 1;
    const newCookedCount = item.cookedCount - 1;

    const success = await updateOrderItemStatus(orderId, itemId, 'New', newQuantity, newCookedCount);
    if (success) {
      await fetchOrders();
      if (order.status === 'completed') {
        await updateOrderStatus(orderId, 'pending');
        await fetchOrders();
      }
    } else {
      toast({ title: "Error", description: "Failed to revert item status.", variant: "destructive" });
    }
  }, [orders, fetchOrders, toast]);
  
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
    
    // In a real app with a DB, you'd likely update an 'order' or 'priority' field.
    // For now, we are just reordering on the client. A refetch would undo this.
    // This is a UI-only drag and drop for now.
    setOrders(currentOrders => {
        const pending = currentOrders.filter(o => o.status === 'pending');
        const completed = currentOrders.filter(o => o.status === 'completed');

        const draggedOrder = pending.find(o => o.id === draggedOrderId);
        if (!draggedOrder || draggedOrder.isPinned) {
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
  }, [orders, fetchOrders, toast]);

  const pendingOrders = useMemo(() => {
      const pending = orders.filter(o => o.status === 'pending');
      const pinned = pending.filter(o => o.isPinned);
      const unpinned = pending.filter(o => !o.isPinned);
      return [...pinned, ...unpinned];
  }, [orders]);

  const completedOrders = useMemo(() => orders.filter(o => o.status === 'completed'), [orders]);
  
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
