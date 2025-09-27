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
        console.log('Loading order positions from database');
        
        // Refresh orders to get the latest data
        await refreshOrders();
        
        // Get current valid order IDs from the database
        const response = await fetch(`/api/orders`);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to load orders: ${response.status} ${errorText}`);
        }
        
        const allOrders = await response.json();
        const validOrderIds = new Set(allOrders.map((order: any) => order.id));
        console.log('Valid order IDs from database:', Array.from(validOrderIds));
        
        const pendingResponse = await fetch(`/api/order-positions?tabName=pending`);
        if (pendingResponse.ok) {
          const pendingPositions = await pendingResponse.json();
          console.log('Raw pending positions from DB:', pendingPositions);
          
          const pendingMap: Record<number, number> = {};
          pendingPositions.forEach((pos: any) => {
            // Only include positions for orders that actually exist
            if (validOrderIds.has(pos.order_id)) {
              pendingMap[pos.order_id] = pos.position;
            } else {
              console.warn(`Found position for non-existent order ID in pending tab: ${pos.order_id}`);
            }
          });
          console.log('Filtered pending positions:', pendingMap);
          
          const completedResponse = await fetch(`/api/order-positions?tabName=completed`);
          if (completedResponse.ok) {
            const completedPositions = await completedResponse.json();
            console.log('Raw completed positions from DB:', completedPositions);
            
            const completedMap: Record<number, number> = {};
            completedPositions.forEach((pos: any) => {
              // Only include positions for orders that actually exist
              if (validOrderIds.has(pos.order_id)) {
                completedMap[pos.order_id] = pos.position;
              } else {
                console.warn(`Found position for non-existent order ID in completed tab: ${pos.order_id}`);
              }
            });
            console.log('Filtered completed positions:', completedMap);
            
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
    
    // Set up periodic refresh
    const interval = setInterval(async () => {
      try {
        // Refresh orders to get the latest data
        await refreshOrders();
        
        // Reload order positions after refreshing orders to maintain custom positions
        const response = await fetch(`/api/orders`);
        if (!response.ok) return;
        
        const allOrders = await response.json();
        const validOrderIds = new Set(allOrders.map((order: any) => order.id));
        
        const pendingResponse = await fetch(`/api/order-positions?tabName=pending`);
        if (pendingResponse.ok) {
          const pendingPositions = await pendingResponse.json();
          
          const pendingMap: Record<number, number> = {};
          pendingPositions.forEach((pos: any) => {
            if (validOrderIds.has(pos.order_id)) {
              pendingMap[pos.order_id] = pos.position;
            }
          });
          
          const completedResponse = await fetch(`/api/order-positions?tabName=completed`);
          if (completedResponse.ok) {
            const completedPositions = await completedResponse.json();
            
            const completedMap: Record<number, number> = {};
            completedPositions.forEach((pos: any) => {
              if (validOrderIds.has(pos.order_id)) {
                completedMap[pos.order_id] = pos.position;
              }
            });
            
            // Only update positions if they've changed to reduce blinking
            setOrderPositions(prevPositions => {
              const pendingChanged = JSON.stringify(prevPositions.pending) !== JSON.stringify(pendingMap);
              const completedChanged = JSON.stringify(prevPositions.completed) !== JSON.stringify(completedMap);
              
              if (pendingChanged || completedChanged) {
                return {
                  pending: pendingMap,
                  completed: completedMap
                };
              }
              return prevPositions;
            });
          }
        }
      } catch (error) {
        console.error('Failed to reload data:', error);
      }
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [refreshOrders]);

  // Add a debounce mechanism to prevent too many simultaneous requests
  let syncTimeout: NodeJS.Timeout | null = null;

  // Sync order positions to database with comprehensive validation
  const syncOrderPositionsToDB = useCallback(async (tabName: string, positions: Record<number, number>) => {
    // Clear any pending sync requests
    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }
    
    // Debounce the sync requests by 100ms to prevent race conditions
    syncTimeout = setTimeout(async () => {
      try {
        // Always get fresh order data to ensure we're working with current information
        const response = await fetch(`/api/orders`);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch orders: ${response.status} ${errorText}`);
        }
        
        const allOrders = await response.json();
        const validOrderIds = new Set(allOrders.map((order: any) => order.id));
        
        // Filter positions to only include orders that actually exist
        const filteredPositions: Record<number, number> = {};
        Object.entries(positions).forEach(([orderId, position]) => {
          const id = parseInt(orderId);
          if (validOrderIds.has(id)) {
            filteredPositions[id] = position;
          }
        });
        
        // Only sync if we have positions to save
        if (Object.keys(filteredPositions).length === 0) {
          return; // Nothing to sync
        }
        
        const positionsArray = Object.entries(filteredPositions).map(([orderId, position]) => ({
          orderId: parseInt(orderId),
          position
        }));
        
        const apiResponse = await fetch('/api/order-positions/batch', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tabName,
            positions: positionsArray
          })
        });
        
        if (!apiResponse.ok) {
          let errorMessage = 'Failed to sync order positions';
          try {
            const errorData = await apiResponse.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
            
            // Handle conflict error by retrying once
            if (apiResponse.status === 409) {
              // Wait a bit and retry
              await new Promise(resolve => setTimeout(resolve, 200));
              const retryResponse = await fetch('/api/order-positions/batch', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  tabName,
                  positions: positionsArray
                })
              });
              
              if (!retryResponse.ok) {
                const retryErrorData = await retryResponse.json();
                throw new Error(retryErrorData.error || retryErrorData.message || 'Retry failed');
              }
              // Retry successful, we're done
              return;
            }
          } catch (parseError) {
            // If we can't parse the error response, use the status text
            const errorText = await apiResponse.text();
            errorMessage = errorText || apiResponse.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }
      } catch (error: any) {
        console.error('Failed to sync order positions to database:', error);
        toast.error(error.message || 'Failed to sync order positions');
      }
    }, 100); // 100ms debounce
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

    // Get current valid order IDs from the database
    const validOrderIds = new Set(orders.map(order => order.id));
    
    // Determine which list we are in based on activeTab and only include valid orders
    const orderList = activeTab === 'pending' ? 
      orders
        .filter(o => o.items.some(i => i.newCount > 0 || i.cookingCount > 0))
        .filter(o => validOrderIds.has(o.id)) :
      orders
        .filter(o => o.items.some(i => i.readyCount > 0 || i.servedCount > 0))
        .filter(o => validOrderIds.has(o.id));
    
    // Get the current positions from state
    const currentPositions = orderPositions[activeTab] ? { ...orderPositions[activeTab] } : {};
    
    // Create new positions object for updating
    const newPositions = { ...currentPositions };
    
    // Get positions of the two orders we're swapping
    const draggedOrderPosition = newPositions[draggedOrderId];
    const dropOrderPosition = newPositions[dropOrderId];
    
    // If both orders have positions, swap them
    if (draggedOrderPosition !== undefined && dropOrderPosition !== undefined) {
      newPositions[draggedOrderId] = dropOrderPosition;
      newPositions[dropOrderId] = draggedOrderPosition;
    }
    // If only the dragged order has a position, move it to the drop order's position
    // and remove the drop order's position tracking
    else if (draggedOrderPosition !== undefined) {
      newPositions[dropOrderId] = draggedOrderPosition;
      delete newPositions[draggedOrderId];
    }
    // If only the drop order has a position, move it to the dragged order's position
    // and remove the dragged order's position tracking
    else if (dropOrderPosition !== undefined) {
      newPositions[draggedOrderId] = dropOrderPosition;
      delete newPositions[dropOrderId];
    }
    // If neither has a position, assign them default positions
    else {
      newPositions[draggedOrderId] = 0;
      newPositions[dropOrderId] = 1;
    }

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
  }, [draggedOrderId, orders, activeTab, orderPositions, syncOrderPositionsToDB]);
  
  const handleDragEnter = (e: DragEvent<HTMLDivElement>, orderId: number) => {
    e.preventDefault();
    if (draggedOrderId !== orderId) {
      const draggedOrder = orders.find(o => o.id === draggedOrderId);
      if (draggedOrder && !draggedOrder.isPinned) {
        setDragOverOrderId(orderId);
      }
    }
  };

  // Filter orders to only include those that exist in the database
  const kitchenOrders = useMemo(() => {
    // Get current valid order IDs from the database
    // This ensures we're always working with orders that actually exist
    const validOrderIds = new Set(orders.map(order => order.id));
    
    const pending = orders
      .filter(o => o.items.some(i => i.newCount > 0 || i.cookingCount > 0))
      .map(o => ({
        ...o,
        items: o.items.filter(i => i.newCount > 0 || i.cookingCount > 0)
      }))
      .filter(o => validOrderIds.has(o.id)); // Only include orders that exist

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
    // Get current valid order IDs from the database
    // This ensures we're always working with orders that actually exist
    const validOrderIds = new Set(orders.map(order => order.id));
    
    const completed = orders
      .filter(o => o.items.some(i => i.readyCount > 0 || i.servedCount > 0))
      .map(o => ({
        ...o,
        items: o.items.filter(i => i.readyCount > 0 || i.servedCount > 0)
      }))
      .filter(o => validOrderIds.has(o.id)); // Only include orders that exist
    
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