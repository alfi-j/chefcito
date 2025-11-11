"use client";
import { useState, useMemo, useEffect, type DragEvent } from "react";
import { OrderCard } from "./components/order-card";
import { type Order, type OrderItem } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card";
import { useI18nStore } from "@/lib/stores/i18n-store";
import useSWR from 'swr';
import { fetcher } from '@/lib/swr-fetcher';
import { type IWorkstation } from '@/models/Workstation';
import { KDS_STATES } from '@/lib/kds-constants';

export default function KdsPage() {
  const [activeTab, setActiveTab] = useState<string>(""); // Will be set to first workstation
  const [draggedOrderId, setDraggedOrderId] = useState<number | null>(null);
  const [dragOverOrderId, setDragOverOrderId] = useState<number | null>(null);
  const { t } = useI18nStore();
  
  // Using SWR with optimized configuration for faster loading
  const { data: orders = [], error, isLoading: loading, mutate } = useSWR<Order[]>('/api/orders', fetcher, {
    fallbackData: [],
    revalidateOnMount: true,
    shouldRetryOnError: true,
    refreshInterval: 0, // Disable polling since we're using SSE
    dedupingInterval: 1000, // Reduce deduping interval
    loadingTimeout: 2000, // Reduce loading timeout
    errorRetryCount: 2, // Reduce retry count
    errorRetryInterval: 3000, // Reduce retry interval
    keepPreviousData: true
  });
  
  // Fetch workstations with optimized configuration
  const { data: workstations = [], isLoading: workstationsLoading } = useSWR<IWorkstation[]>('/api/workstations', fetcher, {
    fallbackData: [],
    revalidateOnMount: true,
    shouldRetryOnError: true,
    refreshInterval: 0, // Disable polling
    dedupingInterval: 3000,
    loadingTimeout: 3000,
    errorRetryCount: 2,
    errorRetryInterval: 5000,
    keepPreviousData: true
  });

  // Set up Server-Sent Events for real-time updates
  useEffect(() => {
    // Create EventSource connection
    const eventSource = new EventSource('/api/orders/events');
    
    // Listen for order updates
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'orders_update') {
          // Revalidate orders data when we receive an update event
          mutate();
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
    };
    
    // Clean up the connection on component unmount
    return () => {
      eventSource.close();
    };
  }, [mutate]);

  // Set the first workstation as the default tab when workstations load
  useEffect(() => {
    if (!workstationsLoading && workstations.length > 0 && activeTab === "") {
      setActiveTab(`workstation-${workstations[0].id || 1}`);
    } else if (!workstationsLoading && workstations.length === 0 && activeTab === "") {
      setActiveTab('workstation-1');
    }
  }, [workstations, workstationsLoading, activeTab]);

  const updateItemStatus = async (orderId: number, itemId: string, fromStatus: 'new' | 'in-progress' | 'ready' | string) => {
    try {
      // Find the current workstation
      const currentWsIndex = workstations.findIndex((ws, index) => 
        `workstation-${ws.id || index + 1}` === activeTab);
      
      const currentWs = workstations[currentWsIndex] || 
        workstations[0] || { states: { new: 'new', inProgress: 'in-progress', ready: 'ready' } };
      
      // Map the status to what the API expects based on workstation states
      let status: string;
      let moveToNextWorkstation = false;
      let nextWorkstationId: string | undefined;
      
      // Use index-based state transitions for more reliable logic
      const normalizedFromStatus = fromStatus.toString().toLowerCase();
      const kdsNew = KDS_STATES.NEW?.toString().toLowerCase();
      const kdsInProgress = KDS_STATES.IN_PROGRESS?.toString().toLowerCase();
      const kdsReady = KDS_STATES.READY?.toString().toLowerCase();
      
      // Check if we're in the last workstation (which is the Completed tab)
      const isCompletedWorkstation = currentWsIndex === workstations.length - 1;
      
      if (normalizedFromStatus === kdsNew) {
        // Move from New to In Progress
        status = currentWs.states.inProgress;
      } else if (normalizedFromStatus === kdsInProgress) {
        // Move from In Progress to Ready
        status = currentWs.states.ready;
        // If this is not the last workstation, we should move to the next one
        if (currentWsIndex < workstations.length - 1 && !isCompletedWorkstation) {
          moveToNextWorkstation = true;
          nextWorkstationId = workstations[currentWsIndex + 1].id;
        }
      } else if (normalizedFromStatus === kdsReady) {
        // When item is marked as ready, move to next workstation if not at last one
        // Otherwise mark the entire order as completed
        if (currentWsIndex < workstations.length - 1 && !isCompletedWorkstation) {
          // Move to next workstation and reset to New state
          const nextWs = workstations[currentWsIndex + 1];
          status = nextWs.states.new;
          moveToNextWorkstation = true;
          nextWorkstationId = nextWs.id;
        } else if (isCompletedWorkstation) {
          // In the completed workstation, mark ready items as served
          status = 'served';
        } else {
          // Last workstation reached, mark item as completed (served)
          status = 'served';
        }
      } else if (fromStatus === 'served') {
        // Keep as served
        status = 'served';
      } else {
        // For custom statuses, move to in-progress
        status = currentWs.states.inProgress;
      }

      const response = await fetch(`/api/orders`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          orderId,
          itemId,
          status,
          moveToNextWorkstation,
          nextWorkstationId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update item status');
      }

      // Refresh the orders list with revalidation
      mutate();
    } catch (error) {
      console.error('Error updating item status:', error);
    }
  };

  const revertItemStatus = async (orderId: number, itemId: string, toStatus: 'new' | 'in-progress' | 'ready' | string) => {
    try {
      // Find the current workstation
      const currentWsIndex = workstations.findIndex((ws, index) => 
        `workstation-${ws.id || index + 1}` === activeTab);
      
      const currentWs = workstations[currentWsIndex] || 
        workstations[0] || { states: { new: 'new', inProgress: 'in-progress', ready: 'ready' } };
      
      // Map the status to what the API expects based on workstation states
      let status: string;
      
      // Use index-based state transitions for more reliable logic
      const normalizedToStatus = toStatus.toString().toLowerCase();
      const kdsNew = KDS_STATES.NEW?.toString().toLowerCase();
      const kdsInProgress = KDS_STATES.IN_PROGRESS?.toString().toLowerCase();
      const kdsReady = KDS_STATES.READY?.toString().toLowerCase();
      
      if (normalizedToStatus === kdsNew) {
        status = currentWs.states.new;
      } else if (normalizedToStatus === kdsInProgress) {
        status = currentWs.states.inProgress;
      } else if (normalizedToStatus === kdsReady) {
        status = currentWs.states.ready;
      } else {
        // For custom statuses, use as is
        status = toStatus;
      }

      const response = await fetch(`/api/orders`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          orderId,
          itemId,
          status
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to revert item status');
      }

      // Refresh the orders list with revalidation
      mutate();
    } catch (error) {
      console.error('Error reverting item status:', error);
    }
  };
  
  // Provide default workstation states if none exist
  const defaultWorkstationStates = {
    new: 'new',
    inProgress: 'in-progress',
    ready: 'ready'
  };

  const togglePinOrder = async (orderId: number) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/pin`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to toggle order pin');
      }

      // Refresh the orders list with revalidation
      mutate();
    } catch (error) {
      console.error('Error toggling order pin:', error);
    }
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, orderId: number) => {
    setDraggedOrderId(orderId);
    e.dataTransfer.effectAllowed = 'move';
    // Add data to transfer
    e.dataTransfer.setData('text/plain', orderId.toString());
  };

  const handleDragEnd = () => {
    setDraggedOrderId(null);
    setDragOverOrderId(null);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>, dropOrderId: number) => {
    e.preventDefault();
    if (draggedOrderId === null || draggedOrderId === dropOrderId) {
      handleDragEnd();
      return;
    }

    // Reorder the orders by swapping positions
    try {
      // Send reorder request to the server to swap the two orders
      const response = await fetch(`/api/orders`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          type: 'reorder',
          orderId: draggedOrderId,
          targetOrderId: dropOrderId // Send the target order ID to swap with
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder orders');
      }
      
      // Optimistically update the UI without waiting for revalidation
      // This makes the UI feel more responsive
      mutate();
      
    } catch (error) {
      console.error('Error reordering orders:', error);
      // Revalidate to ensure UI is consistent with server state on error
      mutate();
    }

    handleDragEnd();
  };
  
  const handleDragEnter = (e: DragEvent<HTMLDivElement>, orderId: number) => {
    e.preventDefault();
    if (draggedOrderId !== orderId) {
      const draggedOrder = orders.find((o: Order) => o.id === draggedOrderId);
      if (draggedOrder && !draggedOrder.isPinned) {
        setDragOverOrderId(orderId);
      }
    }
  };

  // Memoize workstation orders computation with better performance
  const workstationOrders = useMemo(() => {
    // Create a map of workstation orders
    const wsOrders: Record<string, Order[]> = {};
    
    // Initialize with all workstations
    workstations.forEach((ws, index) => {
      const wsId = `workstation-${ws.id || index + 1}`;
      wsOrders[wsId] = [];
    });
    
    console.log('Workstations:', workstations);
    console.log('Orders:', orders);
    
    // Distribute orders based on item statuses and workstation assignments
    orders.forEach((order: Order) => {
      // Skip completed orders unless they belong to a "Completed" workstation
      const isOrderCompleted = order.status === 'completed';
      
      if (isOrderCompleted) {
        // Find "Completed" workstation if it exists
        const completeWs = workstations.find(ws => ws.name === 'Completed');
        if (completeWs) {
          const wsId = `workstation-${completeWs.id}`;
          if (!wsOrders[wsId]) wsOrders[wsId] = [];
          wsOrders[wsId].push(order);
        }
        return; // Skip to next order
      }
      
      // For each workstation, check if any items belong to it
      workstations.forEach((ws, wsIndex) => {
        const wsId = `workstation-${ws.id || wsIndex + 1}`;
        if (!wsOrders[wsId]) wsOrders[wsId] = [];
        
        // Check if any item in this order belongs to this workstation
        const itemsForThisWorkstation = order.items.filter((i: OrderItem) => {
          // If item has a workstationId, check if it matches current workstation
          if (i.workstationId) {
            console.log(`Item ${i.id} has workstationId ${i.workstationId}, checking against workstation ${ws.id}`);
            const match = i.workstationId === ws.id;
            console.log(`Match result: ${match}`);
            return match;
          }
          
          // For items without explicit workstationId:
          // First workstation gets New and In Progress items
          // Last workstation gets Ready and Served items
          // Middle workstations don't get items without explicit workstation assignment
          const normalizedStatus = i.status?.toString().toLowerCase();
          const kdsNew = KDS_STATES.NEW?.toString().toLowerCase();
          const kdsInProgress = KDS_STATES.IN_PROGRESS?.toString().toLowerCase();
          const kdsReady = KDS_STATES.READY?.toString().toLowerCase();
          
          if (wsIndex === 0) {
            // First workstation gets New and In Progress items
            return normalizedStatus === kdsNew ||
                   normalizedStatus === 'new' ||
                   normalizedStatus === 'in-progress' ||
                   normalizedStatus === kdsInProgress;
          } else if (wsIndex === workstations.length - 1) {
            // Last workstation gets Ready and Served items
            return normalizedStatus === kdsReady ||
                   normalizedStatus === 'ready' ||
                   i.status === 'served';
          } else {
            // Middle workstations (like "Meseros") don't automatically get items
            // They only get items that are explicitly assigned to them via workstationId
            return false;
          }
        });
        
        console.log(`Workstation ${ws.name} (${ws.id}) has ${itemsForThisWorkstation.length} items from order ${order.id}`);
        
        // Add order to workstation if it has items for that workstation
        if (itemsForThisWorkstation.length > 0) {
          // Create a copy of the order with only the items for this workstation
          const orderCopy: Order = {
            ...order,
            items: itemsForThisWorkstation
          };
          
          // Check if an order with the same ID already exists in this workstation
          const existingOrderIndex = wsOrders[wsId].findIndex(o => o.id === orderCopy.id);
          if (existingOrderIndex !== -1) {
            // If order already exists, merge the items
            wsOrders[wsId][existingOrderIndex] = {
              ...wsOrders[wsId][existingOrderIndex],
              items: [
                ...wsOrders[wsId][existingOrderIndex].items,
                ...orderCopy.items
              ]
            };
          } else {
            // Add new order
            wsOrders[wsId].push(orderCopy);
          }
        }
      });
    });
    
    // Handle case with no workstations
    if (workstations.length === 0) {
      // Filter orders to only include those with items in initial states
      const ordersWithInitialItems = orders.filter((order: Order) => 
        order.status === 'pending' && order.items.some((i: OrderItem) => {
          const normalizedStatus = i.status?.toString().toLowerCase();
          return normalizedStatus === KDS_STATES.NEW?.toString().toLowerCase() ||
                 normalizedStatus === 'new' ||
                 normalizedStatus === 'in-progress' ||
                 normalizedStatus === KDS_STATES.IN_PROGRESS?.toString().toLowerCase();
        })
      );
      wsOrders['workstation-1'] = ordersWithInitialItems;
    }
    
    // Sort each workstation's orders by position, then by pinned status and creation date
    Object.keys(wsOrders).forEach(key => {
      wsOrders[key] = wsOrders[key].sort((a: Order, b: Order) => {
        // If one is pinned and the other isn't, pinned comes first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        
        // If both are pinned or both are unpinned, sort by position
        if (a.position !== undefined && b.position !== undefined) {
          return a.position - b.position;
        }
        
        // If position is not defined, sort by creation date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    });
    
    console.log('Final workstation orders:', wsOrders);
    
    return wsOrders;
  }, [orders, workstations]);

  const renderOrderList = (orderList: Order[], workstationIndex: number) => {
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
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 items-start" onDragOver={(e) => e.preventDefault()}>
        {orderList.map((order) => (
          <OrderCard 
            key={order.id}
            order={order}
            items={order.items} // These are already the filtered items for this workstation
            onUpdateItemStatus={updateItemStatus}
            onRevertItemStatus={revertItemStatus}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onDragEnter={handleDragEnter}
            isDraggingOver={dragOverOrderId === order.id}
            onTogglePin={togglePinOrder}
            workstationIndex={workstationIndex}
            totalWorkstations={workstations.length}
            workstationName={workstations[workstationIndex]?.name}
          />
        ))}
      </div>
    );
  };

  // Don't render the tabs until we have a valid activeTab or we know there are no workstations
  if (activeTab === "" && workstationsLoading) {
    return (
      <Card>
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <p>{t('kds.loading')}</p>
        </div>
      </Card>
    );
  }

  // If we've finished loading and have no workstations, show empty state
  if (activeTab === "" && !workstationsLoading && workstations.length === 0) {
    return (
      <Card>
        <Tabs value="workstation-1" onValueChange={setActiveTab} className="p-4 sm:p-6">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(1, minmax(0, 1fr))` }}>
            <TabsTrigger value="workstation-1">
              {t('kds.tabs.kitchen')} (0)
            </TabsTrigger>
          </TabsList>
          <TabsContent value="workstation-1" className="pt-4 sm:pt-6">
            {renderOrderList([], 0)}
          </TabsContent>
        </Tabs>
      </Card>
    );
  }

  // If we've finished loading and have workstations but activeTab is still not set, 
  // it means we just need to set the default tab
  if (activeTab === "" && !workstationsLoading && workstations.length > 0) {
    // This should be handled by the useEffect, but just in case
    const firstWsId = `workstation-${workstations[0].id || 1}`;
    return (
      <Card>
        <Tabs value={firstWsId} onValueChange={setActiveTab} className="p-4 sm:p-6">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${workstations.length}, minmax(0, 1fr))` }}>
            {workstations.map((ws, index) => {
              const wsId = `workstation-${ws.id || index + 1}`;
              const orderCount = workstationOrders[wsId]?.length || 0;
              
              return (
                <TabsTrigger key={ws.id || index} value={wsId}>
                  {ws.name} ({orderCount})
                </TabsTrigger>
              );
            })}
          </TabsList>
          {workstations.map((ws, index) => {
            const wsId = `workstation-${ws.id || index + 1}`;
            return (
              <TabsContent key={ws.id || index} value={wsId} className="pt-4 sm:pt-6">
                {renderOrderList(workstationOrders[wsId] || [], index)}
              </TabsContent>
            );
          })}
        </Tabs>
      </Card>
    );
  }

  return (
    <Card>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="p-4 sm:p-6">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.max(workstations.length, 1)}, minmax(0, 1fr))` }}>
          {workstations.map((ws, index) => {
            // Show count of orders for each workstation
            const wsId = `workstation-${ws.id || index + 1}`;
            const orderCount = workstationOrders[wsId]?.length || 0;
            
            return (
              <TabsTrigger key={ws.id || index} value={wsId}>
                {ws.name} ({orderCount})
              </TabsTrigger>
            );
          })}
          {workstations.length === 0 && (
            <TabsTrigger value="workstation-1">
              {t('kds.tabs.kitchen')} ({workstationOrders['workstation-1']?.length || 0})
            </TabsTrigger>
          )}
        </TabsList>
        {workstations.map((ws, index) => {
          const wsId = `workstation-${ws.id || index + 1}`;
          return (
            <TabsContent key={ws.id || index} value={wsId} className="pt-4 sm:pt-6">
              {renderOrderList(workstationOrders[wsId] || [], index)}
            </TabsContent>
          );
        })}
        {workstations.length === 0 && (
          <TabsContent value="workstation-1" className="pt-4 sm:pt-6">
            {renderOrderList(workstationOrders['workstation-1'] || [], 0)}
          </TabsContent>
        )}
      </Tabs>
    </Card>
  );
}