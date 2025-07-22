
"use client";
import { useState, useEffect, useCallback, useMemo, type DragEvent } from "react";
import { OrderCard } from "./components/order-card";
import { initialOrders, type Order } from "@/lib/data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const isOrderCompleted = (order: Order) => order.items.every(item => item.quantity === 0);

const statusSequence: ('New' | 'Cooking' | 'Cooked')[] = ['New', 'Cooking', 'Cooked'];


export default function KdsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState('pending');

  // Drag and Drop State
  const [draggedOrderId, setDraggedOrderId] = useState<number | null>(null);
  const [dragOverOrderId, setDragOverOrderId] = useState<number | null>(null);

  useEffect(() => {
    const sortedInitialOrders = [...initialOrders].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    setOrders(sortedInitialOrders);
  }, []);

  const updateItemStatus = useCallback((orderId: number, itemId: string) => {
    setOrders(currentOrders => {
      const updatedOrders = currentOrders.map(order => {
        if (order.id === orderId) {
          const updatedItems = order.items.map(item => {
            if (item.id === itemId) {
              if (item.status === 'Cooked') return item;

              const currentIndex = statusSequence.indexOf(item.status);
              const nextStatus = statusSequence[currentIndex + 1];

              if (nextStatus === 'Cooked') {
                 const newQuantity = item.quantity - 1;
                 const newCookedCount = item.cookedCount + 1;
 
                 const newStatus = newQuantity > 0 ? 'New' : 'Cooked';
                 
                 return { ...item, quantity: newQuantity, cookedCount: newCookedCount, status: newStatus };

              } else {
                return { ...item, status: nextStatus };
              }
            }
            return item;
          });
          
          const newOrder = {
            ...order,
            items: updatedItems,
          };
          
          if (isOrderCompleted(newOrder)) {
            newOrder.status = 'completed';
          } else {
            newOrder.status = 'pending';
          }

          return newOrder;
        }
        return order;
      });
      return updatedOrders;
    });
  }, []);

  const revertItemStatus = useCallback((orderId: number, itemId: string) => {
    setOrders(currentOrders => {
      return currentOrders.map(order => {
        if (order.id === orderId) {
          const updatedItems = order.items.map(item => {
            if (item.id === itemId && item.cookedCount > 0) {
              const newQuantity = item.quantity + 1;
              const newCookedCount = item.cookedCount - 1;
              return {
                ...item,
                quantity: newQuantity,
                cookedCount: newCookedCount,
                status: 'New'
              };
            }
            return item;
          });

          const newOrder = { ...order, items: updatedItems };

          if (isOrderCompleted(newOrder)) {
            newOrder.status = 'completed';
          } else {
            newOrder.status = 'pending';
          }

          return newOrder;
        }
        return order;
      });
    });
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

        if (draggedIndex === -1 || dropIndex === -1) {
            return currentOrders;
        }

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
    // Check if the related target is outside the component boundary
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
        setDragOverOrderId(null);
    }
  }


  const pendingOrders = useMemo(() => orders.filter(o => o.status === 'pending'), [orders]);
  const completedOrders = useMemo(() => orders.filter(o => o.status === 'completed'), [orders]);
  
  const renderOrderList = (orderList: Order[]) => {
    if (orderList.length === 0) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)] text-muted-foreground">
                <p>No orders in this category.</p>
            </div>
        )
    }
    return (
        <div 
          className="py-4 columns-1 md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 3xl:columns-6 gap-2"
          onDragOver={(e) => e.preventDefault()}
        >
            {orderList.map((order) => (
                 <div
                   key={order.id}
                   style={{
                     opacity: draggedOrderId === order.id ? 0.5 : 1,
                   }}
                 >
                    <OrderCard 
                        order={order} 
                        onUpdateItemStatus={updateItemStatus}
                        onRevertItemStatus={revertItemStatus}
                        onDragStart={handleDragStart}
                        onDrop={handleDrop}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        isDraggingOver={dragOverOrderId === order.id}
                    />
                 </div>
            ))}
        </div>
    );
  }

  return (
    <Card>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="p-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pending ({pendingOrders.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedOrders.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          {renderOrderList(pendingOrders)}
        </TabsContent>
        <TabsContent value="completed">
          {renderOrderList(completedOrders)}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
