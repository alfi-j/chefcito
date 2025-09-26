"use client";
import { useState, useMemo, type DragEvent, useCallback, useEffect } from "react";
import { OrderCard } from "./components/order-card";
import { type Order, type OrderItem } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card";
import { useI18n } from "@/context/i18n-context";
import { useOrders } from "@/hooks/use-orders";
import { toast } from "sonner";


export default function KdsPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [draggedOrderId, setDraggedOrderId] = useState<number | null>(null);
  const [dragOverOrderId, setDragOverOrderId] = useState<number | null>(null);
  const [orderPositions, setOrderPositions] = useState<Record<string, Record<number, number>>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kds_order_positions');
      return saved ? JSON.parse(saved) : { pending: {}, completed: {} };
    }
    return { pending: {}, completed: {} };
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const { t } = useI18n();
  
  const { 
    orders, 
    loading, 
    updateItemStatus, 
    revertItemStatus, 
    toggleOrderPin,
    refreshOrders
  } = useOrders();

  // Save order positions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('kds_order_positions', JSON.stringify(orderPositions));
  }, [orderPositions]);

  // Load order positions from database on component mount
  useEffect(() => {
    const loadOrderPositionsFromDB = async () => {
      try {
        setIsSyncing(true);
        const response = await fetch(`/api/order-positions?tabName=pending`);
        if (response.ok) {
          const pendingPositions = await response.json();
          const pendingMap: Record<number, number> = {};
          pendingPositions.forEach((pos: any) => {
            pendingMap[pos.order_id] = pos.position;
          });
          
          const response2 = await fetch(`/api/order-positions?tabName=completed`);
          if (response2.ok) {
            const completedPositions = await response2.json();
            const completedMap: Record<number, number> = {};
            completedPositions.forEach((pos: any) => {
              completedMap[pos.order_id] = pos.position;
            });
            
            setOrderPositions({
              pending: pendingMap,
              completed: completedMap
            });
          }
        }
      } catch (error) {
        console.error('Failed to load order positions from database:', error);
        toast.error('Failed to load order positions');
      } finally {
        setIsSyncing(false);
      }
    };
    
    loadOrderPositionsFromDB();
  }, []);

  // Sync order positions to database
  const syncOrderPositionsToDB = useCallback(async (tabName: string, positions: Record<number, number>) => {
    try {
      const positionsArray = Object.entries(positions).map(([orderId, position]) => ({
        orderId: parseInt(orderId),
        position
      }));
      
      const response = await fetch('/api/order-positions/batch', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tabName,
          positions: positionsArray
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync order positions');
      }
    } catch (error: any) {
      console.error('Failed to sync order positions to database:', error);
      toast.error(error.message || 'Failed to sync order positions');
    }
  }, []);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, orderId: number) => {
    setDraggedOrderId(orderId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedOrderId(null);
    setDragOverOrderId(null);
  };

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>, dropOrderId: number) => {
    e.preventDefault();
    if (draggedOrderId === null || draggedOrderId === dropOrderId) {
      handleDragEnd();
      return;
    }

    const draggedOrder = orders.find(o => o.id === draggedOrderId);
    const dropOrder = orders.find(o => o.id === dropOrderId);

    if (!draggedOrder || !dropOrder || draggedOrder.isPinned || dropOrder.isPinned) {
      // Can't reorder pinned orders
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

    // Reorder the orders in the list
    const newOrders = [...orderList];
    const [movedOrder] = newOrders.splice(fromIndex, 1);
    newOrders.splice(toIndex, 0, movedOrder);

    // Update positions in state
    const newPositions: Record<number, number> = {};
    newOrders
      .filter(o => !o.isPinned) // Only track positions for non-pinned orders
      .forEach((order, index) => {
        newPositions[order.id] = index;
      });

    setOrderPositions(prev => {
      const updatedPositions = {
        ...prev,
        [activeTab]: newPositions
      };
      
      // Sync to database
      syncOrderPositionsToDB(activeTab, newPositions);
      
      return updatedPositions;
    });

    handleDragEnd();
  }, [draggedOrderId, orders, activeTab, syncOrderPositionsToDB]);
  
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

    const unpinnedOrders = pending.filter(o => !o.isPinned);
    const pinnedOrders = pending.filter(o => o.isPinned).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    // Apply custom ordering for unpinned orders
    const tabPositions = orderPositions.pending || {};
    unpinnedOrders.sort((a, b) => {
      const posA = tabPositions[a.id] ?? Number.MAX_SAFE_INTEGER;
      const posB = tabPositions[b.id] ?? Number.MAX_SAFE_INTEGER;
      return posA - posB;
    });
    
    return [...pinnedOrders, ...unpinnedOrders];
  }, [orders, orderPositions]);

  const servingOrders = useMemo(() => {
    const completed = orders
      .filter(o => o.items.some(i => i.readyCount > 0 || i.servedCount > 0))
      .map(o => ({
        ...o,
        items: o.items.filter(i => i.readyCount > 0 || i.servedCount > 0)
      }));
    
    const unpinnedOrders = completed.filter(o => !o.isPinned);
    const pinnedOrders = completed.filter(o => o.isPinned).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    // Apply custom ordering for unpinned orders
    const tabPositions = orderPositions.completed || {};
    unpinnedOrders.sort((a, b) => {
      const posA = tabPositions[a.id] ?? Number.MAX_SAFE_INTEGER;
      const posB = tabPositions[b.id] ?? Number.MAX_SAFE_INTEGER;
      return posA - posB;
    });
    
    return [...pinnedOrders, ...unpinnedOrders];
  }, [orders, orderPositions]);

  
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
            onTogglePin={toggleOrderPin}
          />
        ))}
      </div>
    );
  };

  return (
    <Card>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="p-4 sm:p-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            {t('kds.tabs.kitchen')} ({kitchenOrders.length})
            {isSyncing && activeTab === 'pending' && (
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            {t('kds.tabs.serving')} ({servingOrders.length})
            {isSyncing && activeTab === 'completed' && (
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            )}
          </TabsTrigger>
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