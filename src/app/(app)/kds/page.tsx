"use client";
import useSWR from 'swr';
import { useMemo, useEffect, type DragEvent } from "react";
import { OrderCard } from "./components/order-card";
import { type Order, type OrderItem } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card";
import { useI18nStore } from '@/lib/stores/i18n-store';
import { fetcher } from '@/lib/swr-fetcher';
import { type IWorkstation } from '@/models/Workstation';
import { debugKDS } from '@/lib/helpers';
import { KDS_STATES } from '@/lib/constants';
import useNormalizedKDSStore from '@/lib/stores/kds-store-normalized';

export default function KdsPage() {
  const { t } = useI18nStore();
  const kdsStore = useNormalizedKDSStore();
  const workstations = kdsStore.getSortedWorkstations();
  const orders = kdsStore.getOrders();
  
  const {
    activeTab,
    draggedOrderId,
    dragOverOrderId,
    setWorkstations,
    setOrders,
    setActiveTab,
    setDraggedOrderId,
    setDragOverOrderId,
    transitionItem,
    updateItemStatus,
    revertItemStatus,
    togglePinOrder,
    getWorkstationById,
    getWorkstationIndex,
    getNextWorkstation,
    getPreviousWorkstation,
    getOrderByID,
    getItemsByWorkstation,
    reorderOrderItems,
    handleDragStart,
    handleDragEnd,
    handleDrop,
    handleDragEnter
  } = kdsStore;

  // Using SWR with optimized configuration for faster loading
  const { data: ordersData = [], error, isLoading: loading, mutate } = useSWR<Order[]>('/api/orders', fetcher, {
    fallbackData: [],
    revalidateOnMount: true,
    shouldRetryOnError: true,
    refreshInterval: 0, // Disable polling since we're using SSE
    dedupingInterval: 1000,
    loadingTimeout: 2000,
    errorRetryCount: 2,
    errorRetryInterval: 3000,
    keepPreviousData: true
  });

  // Fetch workstations with optimized configuration
  const { data: workstationsData = [], isLoading: workstationsLoading } = useSWR<IWorkstation[]>('/api/workstations', fetcher, {
    fallbackData: [],
    revalidateOnMount: true,
    shouldRetryOnError: true,
    refreshInterval: 0,
    dedupingInterval: 3000,
    loadingTimeout: 3000,
    errorRetryCount: 2,
    errorRetryInterval: 5000,
    keepPreviousData: true
  });

  // Update store when data changes
  useEffect(() => {
    if (Array.isArray(ordersData)) {
      setOrders(ordersData);
    }
  }, [ordersData, setOrders]);

  useEffect(() => {
    if (Array.isArray(workstationsData)) {
      setWorkstations(workstationsData);
    }
  }, [workstationsData, setWorkstations]);

  // Set up Server-Sent Events for real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/api/orders/events');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        debugKDS('SSE message received:', data);
        if (data.type === 'orders_update') {
          mutate();
        }
      } catch (error) {
        debugKDS('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      debugKDS('SSE error:', error);
    };

    return () => {
      eventSource.close();
    };
  }, [mutate]);

  // Set the first workstation as the default tab when workstations load
  useEffect(() => {
    if (!workstationsLoading && Array.isArray(workstationsData) && workstationsData.length > 0 && activeTab === "") {
      setActiveTab(`workstation-${workstationsData[0].id || 1}`);
    } else if (!workstationsLoading && Array.isArray(workstationsData) && workstationsData.length === 0 && activeTab === "") {
      setActiveTab('workstation-1');
    }
  }, [workstationsData, workstationsLoading, activeTab, setActiveTab]);

  // Memoize workstation orders computation - simplified with explicit workstation IDs
  const workstationOrders = useMemo(() => {
    // Ensure orders is an array
    const safeOrders = Array.isArray(orders) ? orders : [];
    const safeWorkstations = Array.isArray(workstations) ? workstations : [];
    
    const wsOrders: Record<string, Order[]> = {};

    // Initialize with all workstations
    safeWorkstations.forEach((ws) => {
      const wsId = `workstation-${ws.id}`;
      wsOrders[wsId] = [];
    });

    // Distribute orders based on explicit workstation assignments
    safeOrders.forEach((order: Order) => {
      if (order.status === 'completed') {
        return;
      }

      // Group items by their workstation
      const itemsByWorkstation: Record<string, OrderItem[]> = {};

      // Sort items by position before grouping
      const sortedItems = [...order.items].sort((a, b) => {
        // Sort by position if available
        if (a.position !== undefined && b.position !== undefined) {
          return a.position - b.position;
        }
        // If position is not available, sort by creation timestamp or ID
        return a.id.localeCompare(b.id);
      });

      sortedItems.forEach((item: OrderItem) => {
        // Assign to workstation based on workstationId or default to first workstation
        const workstationId = item.workstationId || (safeWorkstations[0]?.id);
        if (!workstationId) return;

        if (!itemsByWorkstation[workstationId]) {
          itemsByWorkstation[workstationId] = [];
        }
        itemsByWorkstation[workstationId].push(item);
      });

      // Create order copies for each workstation with items
      Object.entries(itemsByWorkstation).forEach(([workstationId, items]) => {
        // Find workstation by id
        const ws = safeWorkstations.find(w => w.id === workstationId);
        if (!ws) return;

        const wsId = `workstation-${ws.id}`;
        if (!wsOrders[wsId]) wsOrders[wsId] = [];

        const orderCopy: Order = {
          ...order,
          items: items
        };

        wsOrders[wsId].push(orderCopy);
      });
    });

    // Handle case with no workstations
    if (safeWorkstations.length === 0) {
      wsOrders['workstation-1'] = safeOrders.filter((order: Order) => order.status === 'pending');
    }

    // Sort each workstation's orders
    Object.keys(wsOrders).forEach(key => {
      wsOrders[key] = wsOrders[key].sort((a: Order, b: Order) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        if (a.position !== undefined && b.position !== undefined) {
          return a.position - b.position;
        }

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    });

    debugKDS('workstationOrders computed:', wsOrders);
    return wsOrders;
  }, [orders, workstations]);

  const renderOrderList = (orderList: Order[], workstationIndex: number) => {
    // Ensure orderList is an array
    const safeOrderList = Array.isArray(orderList) ? orderList : [];
    
    if (loading) {
      return <div className="flex justify-center items-center h-[calc(100vh-200px)]"><p>{t('kds.loading')}</p></div>
    }
    if (safeOrderList.length === 0) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-200px)] text-muted-foreground">
          <p>{t('kds.no_orders')}</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 items-start" onDragOver={(e) => e.preventDefault()}>
        {safeOrderList.map((order) => (
          <OrderCard
            key={`${order.id}-${workstationIndex}`} // Add workstationIndex to key to force re-render when workstation changes
            order={order}
            items={order.items}
            onUpdateItemStatus={updateItemStatus}
            onRevertItemStatus={revertItemStatus}
            onDragStart={(e) => handleDragStart(e, order.id)}
            onDrop={(e) => handleDrop(e, order.id)}
            onDragEnter={(e) => handleDragEnter(e, order.id)}
            isDraggingOver={dragOverOrderId === order.id}
            onTogglePin={togglePinOrder}
            workstationIndex={workstationIndex}
            totalWorkstations={workstations.length}
            workstationName={workstations[workstationIndex]?.name}
            isLastWorkstation={workstationIndex === workstations.length - 1}
          />
        ))}
      </div>
    );
  };

  // Render workstations dynamically
  const renderWorkstations = () => {
    if (activeTab === "" && workstationsLoading) {
      return (
        <Card key="loading-card">
          <div className="flex justify-center items-center h-[calc(100vh-200px)]">
            <p>{t('kds.loading')}</p>
          </div>
        </Card>
      );
    }

    if (activeTab === "" && !workstationsLoading && workstations.length === 0) {
      return (
        <Card key="empty-card">
          <Tabs value="workstation-1" onValueChange={setActiveTab} className="p-4 sm:p-6">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(1, minmax(0, 1fr))` }}>
              <TabsTrigger value="workstation-1" key="workstation-1">
                {t('kds.tabs.kitchen')} (0)
              </TabsTrigger>
            </TabsList>
            <TabsContent value="workstation-1" key="content-workstation-1" className="pt-4 sm:p-6">
              {renderOrderList([], 0)}
            </TabsContent>
          </Tabs>
        </Card>
      );
    }

    // Dynamic rendering for all workstation counts
    return (
      <Card key="workstations-card">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="p-4 sm:p-6">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.max(workstations.length, 1)}, minmax(0, 1fr))` }}>
            {workstations.map((ws, index) => {
              const wsId = `workstation-${ws.id}`;
              const orderCount = workstationOrders[wsId]?.length || 0;

              return (
                <TabsTrigger key={`trigger-${ws.id}`} value={wsId}>
                  {ws.name} ({orderCount})
                </TabsTrigger>
              );
            })}
            {workstations.length === 0 && (
              <TabsTrigger value="workstation-1" key="workstation-1-empty">
                {t('kds.tabs.kitchen')} ({workstationOrders['workstation-1']?.length || 0})
              </TabsTrigger>
            )}
          </TabsList>
          {workstations.map((ws, index) => {
            const wsId = `workstation-${ws.id}`;
            return (
              <TabsContent key={`content-${ws.id}`} value={wsId} className="pt-4 sm:p-6">
                {renderOrderList(workstationOrders[wsId] || [], index)}
              </TabsContent>
            );
          })}
          {workstations.length === 0 && (
            <TabsContent value="workstation-1" key="content-workstation-1-empty" className="pt-4 sm:p-6">
              {renderOrderList(workstationOrders['workstation-1'] || [], 0)}
            </TabsContent>
          )}
        </Tabs>
      </Card>
    );
  };

  return renderWorkstations();
}