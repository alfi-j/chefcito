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
  
  // Using SWR directly instead of the custom hook
  const { data: orders = [], error, isLoading: loading, mutate } = useSWR<Order[]>('/api/orders', fetcher, {
    fallbackData: [],
    revalidateOnMount: true,
    shouldRetryOnError: true
  });
  
  // Fetch workstations
  const { data: workstations = [], isLoading: workstationsLoading } = useSWR<IWorkstation[]>('/api/workstations', fetcher, {
    fallbackData: [],
    revalidateOnMount: true,
    shouldRetryOnError: true
  });

  // Set the first workstation as the default tab when workstations load
  useEffect(() => {
    if (!workstationsLoading && workstations.length > 0 && activeTab === "") {
      setActiveTab(`workstation-${workstations[0].id || 1}`);
    } else if (!workstationsLoading && workstations.length === 0 && activeTab === "") {
      setActiveTab('workstation-1');
    }
  }, [workstations, workstationsLoading, activeTab]);

  // Debugging: Log the orders data
  useEffect(() => {
    if (orders && orders.length > 0) {
      console.log('KDS Orders Data:', orders);
    }
  }, [orders]);

  const updateItemStatus = async (orderId: number, itemId: string, fromStatus: 'new' | 'in-progress' | 'ready' | 'served' | string) => {
    try {
      // Find the current workstation
      const currentWs = workstations.find((ws, index) => 
        `workstation-${ws.id || index + 1}` === activeTab) || 
        workstations[0] || { states: { new: 'new', inProgress: 'in-progress', ready: 'ready' } };
      
      // Map the status to what the API expects based on workstation states
      let status: string;
      if (fromStatus === currentWs.states.new) {
        status = currentWs.states.inProgress;
      } else if (fromStatus === currentWs.states.inProgress) {
        status = currentWs.states.ready;
      } else {
        // For custom statuses or ready state, move to served
        status = 'served';
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
        throw new Error('Failed to update item status');
      }

      // Refresh the orders list
      mutate();
    } catch (error) {
      console.error('Error updating item status:', error);
    }
  };

  const revertItemStatus = async (orderId: number, itemId: string, toStatus: 'new' | 'in-progress' | 'ready' | 'served' | string) => {
    try {
      const response = await fetch(`/api/orders`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          orderId,
          itemId,
          status: toStatus
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to revert item status');
      }

      // Refresh the orders list
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

      // Refresh the orders list
      mutate();
    } catch (error) {
      console.error('Error toggling order pin:', error);
    }
  };

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

    const draggedOrder = orders.find((o: Order) => o.id === draggedOrderId);
    const dropOrder = orders.find((o: Order) => o.id === dropOrderId);

    if (!draggedOrder || !dropOrder) {
      handleDragEnd();
      return;
    }
    
    // Determine which list we are in based on activeTab
    const orderList = activeTab ? workstationOrders[activeTab] || [] : [];
    
    const fromIndex = orderList.findIndex((o: Order) => o.id === draggedOrderId);
    const toIndex = orderList.findIndex((o: Order) => o.id === dropOrderId);

    if (fromIndex === -1 || toIndex === -1) {
       handleDragEnd();
       return;
    }

    // Note: We don't need setOrders anymore since we're using SWR
    // The mutate function will handle updating the data

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

  const workstationOrders = useMemo(() => {
    // Create a map of workstation orders
    const wsOrders: Record<string, Order[]> = {};
    
    // Initialize with all workstations
    workstations.forEach((ws, index) => {
      wsOrders[`workstation-${ws.id || index + 1}`] = [];
    });
    
    // Show all orders with all items in the first tab
    // Filter orders to only include those with items in initial states
    const ordersWithInitialItems = orders.filter((order: Order) => 
      order.status === 'pending' && order.items.some((i: OrderItem) => 
        i.status?.toString().toLowerCase() === KDS_STATES.NEW?.toString().toLowerCase() ||
        i.status?.toString().toLowerCase() === 'new' ||
        i.status?.toString().toLowerCase() === 'in-progress' ||
        i.status?.toString().toLowerCase() === KDS_STATES.IN_PROGRESS?.toString().toLowerCase()
      )
    );
    
    // Filter completed orders
    const completedOrders = orders.filter((order: Order) => 
      order.items.every((i: OrderItem) => 
        i.status?.toString().toLowerCase() === 'served' ||
        i.status?.toString().toLowerCase() === 'completed'
      )
    );
    
    if (workstations.length > 0) {
      // Put all orders in the first workstation tab
      const firstWsId = `workstation-${workstations[0].id || 1}`;
      wsOrders[firstWsId] = ordersWithInitialItems;
      
      // Find "Completed" workstation if it exists
      const completeWs = workstations.find(ws => ws.name === 'Completed');
      if (completeWs) {
        wsOrders[`workstation-${completeWs.id}`] = completedOrders;
      }
      
      // Also initialize other workstation tabs as empty
      for (let i = 1; i < workstations.length; i++) {
        const wsId = `workstation-${workstations[i].id || i + 1}`;
        if (!wsOrders[wsId]) {
          wsOrders[wsId] = [];
        }
      }
    } else {
      // Handle default workstation if no workstations exist
      wsOrders['workstation-1'] = ordersWithInitialItems;
    }
    
    // Sort each workstation's orders
    Object.keys(wsOrders).forEach(key => {
      const unpinned = wsOrders[key].filter((o: Order) => !o.isPinned);
      const pinned = wsOrders[key].filter((o: Order) => o.isPinned)
        .sort((a: Order, b: Order) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      wsOrders[key] = [...pinned, ...unpinned];
    });
    
    return wsOrders;
  }, [orders, workstations]);

  
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
            {renderOrderList([])}
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
              const orderCount = index === 0 ? 
                workstationOrders[`workstation-${ws.id || index + 1}`]?.length || 0 : 
                0;
              
              return (
                <TabsTrigger key={ws.id || index} value={`workstation-${ws.id || index + 1}`}>
                  {ws.name} ({orderCount})
                </TabsTrigger>
              );
            })}
          </TabsList>
          {workstations.map((ws, index) => {
            const wsId = `workstation-${ws.id || index + 1}`;
            return (
              <TabsContent key={ws.id || index} value={wsId} className="pt-4 sm:pt-6">
                {index === 0 ? renderOrderList(workstationOrders[wsId] || []) : renderOrderList([])}
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
            // For the first tab, show the actual count, for others show 0
            let orderCount = 0;
            const wsId = `workstation-${ws.id || index + 1}`;
            
            if (index === 0) {
              orderCount = workstationOrders[wsId]?.length || 0;
            } else if (ws.name === 'Complete') {
              orderCount = workstationOrders[wsId]?.length || 0;
            }
            
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
              {renderOrderList(workstationOrders[wsId] || [])}
            </TabsContent>
          );
        })}
        {workstations.length === 0 && (
          <TabsContent value="workstation-1" className="pt-4 sm:pt-6">
            {renderOrderList(workstationOrders['workstation-1'] || [])}
          </TabsContent>
        )}
      </Tabs>
    </Card>
  );
}