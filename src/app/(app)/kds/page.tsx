
"use client";
import { useState, useEffect, useCallback, useMemo, type DragEvent } from "react";
import { OrderCard } from "./components/order-card";
import { type Order, type OrderItem } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/context/i18n-context";
import { getInitialOrders, updateOrderItemStatus as mockUpdateItem, updateOrderStatus as mockUpdateStatus, toggleOrderPin as mockTogglePin, getNewOrders } from "@/lib/mock-data";


const isOrderCompleted = (order: Order) => order.items.every(item => item.quantity === 0 && item.cookedCount > 0);

const statusSequence: ('New' | 'Cooking' | 'Cooked')[] = ['New', 'Cooking', 'Cooked'];

const parseOrderDates = (orders: Order[]): Order[] => {
  return orders.map(order => ({
    ...order,
    createdAt: new Date(order.createdAt),
  }));
};

export default function KdsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [draggedOrderId, setDraggedOrderId] = useState<number | null>(null);
  const [dragOverOrderId, setDragOverOrderId] = useState<number | null>(null);
  const { toast } = useToast();
  const { t } = useI18n();

  const fetchOrders = useCallback(() => {
    // In a real app, you'd fetch from an API
    if (loading) {
        const initialOrders = getInitialOrders();
        setOrders(parseOrderDates(initialOrders));
    } else {
        // Simulate polling for new orders
        const newOrders = getNewOrders();
        if (newOrders.length > 0) {
            setOrders(currentOrders => {
                const currentIds = new Set(currentOrders.map(o => o.id));
                const filteredNew = newOrders.filter(o => !currentIds.has(o.id));
                return [...currentOrders, ...parseOrderDates(filteredNew)];
            });
        }
    }
    setLoading(false);
  }, [loading]);


  useEffect(() => {
    fetchOrders(); // Initial fetch
    const interval = setInterval(fetchOrders, 5000); // Poll for new orders
    return () => clearInterval(interval);
  }, [fetchOrders]);
  
  const updateItemStatus = useCallback(async (orderId: number, itemId: string) => {
    const originalOrders = JSON.parse(JSON.stringify(orders)); // Deep copy for revert
    let updatedOrder: Order | undefined;

    // --- Optimistic Update ---
    const newOrders = orders.map(o => {
      if (o.id !== orderId) return o;
      
      const item = o.items.find(i => i.id === itemId);
      if (!item || item.status === 'Cooked') return o;

      const currentIndex = statusSequence.indexOf(item.status);
      const nextStatus = statusSequence[currentIndex + 1];

      let newQuantity = item.quantity;
      let newCookedCount = item.cookedCount;
      let statusForRemaining = item.status;

      if (nextStatus === 'Cooked') {
          newQuantity -= 1;
          newCookedCount += 1;
          statusForRemaining = newQuantity > 0 ? 'New' : 'Cooked';
      }
      
      const newItems = o.items.map(i => {
          if (i.id !== itemId) return i;
          return { ...i, status: nextStatus === 'Cooked' ? statusForRemaining : nextStatus, quantity: newQuantity, cookedCount: newCookedCount };
      });

      updatedOrder = { ...o, items: newItems };
      if (isOrderCompleted(updatedOrder)) {
          updatedOrder.status = 'completed';
      }
      return updatedOrder;
    });

    setOrders(newOrders);
    // --- End Optimistic Update ---

    // --- Mock Backend Call ---
    if (!updatedOrder) return;
    
    const itemToUpdate = updatedOrder.items.find(i => i.id === itemId);
    if (!itemToUpdate) return;
    
    try {
      mockUpdateItem({
        itemId, 
        newStatus: itemToUpdate.status,
        newQuantity: itemToUpdate.quantity, 
        newCookedCount: itemToUpdate.cookedCount
      });

      if (updatedOrder.status === 'completed') {
        mockUpdateStatus({ orderId, newStatus: 'completed' });
      }

    } catch (error: any) {
        toast({ title: t('toast.error'), description: error.message || t('kds.toast.update_item_error'), variant: "destructive" });
        setOrders(parseOrderDates(originalOrders));
    }
  }, [orders, toast, t]);

  const revertItemStatus = useCallback(async (orderId: number, itemId: string) => {
    const originalOrders = JSON.parse(JSON.stringify(orders)); // Deep copy for revert
    
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const item = order.items.find(i => i.id === itemId);
    if (!item || item.cookedCount <= 0) return;

    // --- Optimistic Update ---
    const newQuantity = item.quantity + 1;
    const newCookedCount = item.cookedCount - 1;

    const newOrders = orders.map(o => {
        if (o.id !== orderId) return o;
        return {
            ...o,
            status: 'pending', // Revert order to pending if it was completed
            items: o.items.map(i => {
                if (i.id !== itemId) return i;
                return { ...i, status: 'New', quantity: newQuantity, cookedCount: newCookedCount };
            })
        };
    });

    setOrders(newOrders);
    // --- End Optimistic Update ---

    // --- Mock Backend Call ---
    try {
      mockUpdateItem({ itemId, newStatus: 'New', newQuantity, newCookedCount });
      if (order.status === 'completed') {
        mockUpdateStatus({ orderId, newStatus: 'pending' });
      }
    } catch (error: any) {
      toast({ title: t('toast.error'), description: error.message || t('kds.toast.revert_item_error'), variant: "destructive" });
      setOrders(parseOrderDates(originalOrders)); // Revert on error
    }
  }, [orders, toast, t]);
  
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

  const togglePinOrder = useCallback(async (orderId: number) => {
    const originalOrders = [...orders];
    const orderToPin = orders.find(o => o.id === orderId);
    if (!orderToPin) return;

    const newPinState = !orderToPin.isPinned;
    
    // Optimistic Update
    setOrders(currentOrders => currentOrders.map(o => o.id === orderId ? { ...o, isPinned: newPinState } : o));

    // Mock backend call
    try {
      mockTogglePin({ orderId, isPinned: newPinState });
    } catch (error: any) {
       toast({ title: t('toast.error'), description: error.message || t('kds.toast.pin_error'), variant: "destructive" });
       setOrders(originalOrders);
    }
  }, [orders, toast, t]);

  const pendingOrders = useMemo(() => {
    const pending = orders.filter(o => o.status === 'pending');
    const unpinned = pending.filter(o => !o.isPinned);
    const pinned = pending.filter(o => o.isPinned).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return [...pinned, ...unpinned];
  }, [orders]);

  const completedOrders = useMemo(() => {
      return orders.filter(o => o.status === 'completed').sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="p-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">{t('kds.tabs.pending')} ({pendingOrders.length})</TabsTrigger>
          <TabsTrigger value="completed">{t('kds.tabs.completed')} ({completedOrders.length})</TabsTrigger>
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
