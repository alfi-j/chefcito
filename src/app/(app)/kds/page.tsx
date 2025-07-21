"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { OrderCard } from "./components/order-card";
import { initialOrders, type Order } from "@/lib/data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card";

const isOrderCompleted = (order: Order) => order.items.every(item => item.quantity === 0);

const statusSequence: ('New' | 'Cooking' | 'Cooked')[] = ['New', 'Cooking', 'Cooked'];

export default function KdsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    // Sort orders by creation time on initial load
    const sortedInitialOrders = [...initialOrders].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    setOrders(sortedInitialOrders);
  }, []);

  const updateItemStatus = useCallback((orderId: number, itemId: string) => {
    setOrders(currentOrders => {
      const updatedOrders = currentOrders.map(order => {
        if (order.id === orderId) {
          const updatedItems = order.items.map(item => {
            if (item.id === itemId) {
              // If already 'Cooked', do nothing
              if (item.status === 'Cooked') return item;

              const currentIndex = statusSequence.indexOf(item.status);
              const nextStatus = statusSequence[currentIndex + 1];

              if (nextStatus === 'Cooked') {
                 // Decrement quantity and increment cookedCount
                 const newQuantity = item.quantity - 1;
                 const newCookedCount = item.cookedCount + 1;
 
                 // If there are still items left, reset status to New, else it is Cooked
                 const newStatus = newQuantity > 0 ? 'New' : 'Cooked';
                 
                 return { ...item, quantity: newQuantity, cookedCount: newCookedCount, status: newStatus };

              } else {
                // Just update status to 'Cooking'
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
              // When an item is reverted, its status should go back to 'New'
              // for the active portion.
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

          // If an order was completed, it must now be pending again.
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
  
  const handleMoveOrder = useCallback((orderId: number, direction: 'left' | 'right') => {
    setOrders(currentOrders => {
        const pending = currentOrders.filter(o => o.status === 'pending');
        const completed = currentOrders.filter(o => o.status === 'completed');
        
        const orderIndex = pending.findIndex(o => o.id === orderId);
        if (orderIndex === -1) return currentOrders;

        const newIndex = direction === 'left' ? orderIndex - 1 : orderIndex + 1;

        if (newIndex < 0 || newIndex >= pending.length) {
            return currentOrders; // Cannot move further
        }

        const newPending = [...pending];
        const [movedOrder] = newPending.splice(orderIndex, 1);
        newPending.splice(newIndex, 0, movedOrder);

        return [...newPending, ...completed];
    });
  }, []);

  const pendingOrders = useMemo(() => orders.filter(o => o.status === 'pending'), [orders]);
  const completedOrders = useMemo(() => orders.filter(o => o.status === 'completed'), [orders]);

  const renderOrderList = (orderList: Order[], listType: 'pending' | 'completed') => {
    if (orderList.length === 0) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)] text-muted-foreground">
                <p>No orders in this category.</p>
            </div>
        )
    }
    return (
        <div className="py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-2 items-start">
            {orderList.map((order, index) => (
                <div key={order.id} className="break-inside-avoid">
                    <OrderCard 
                        order={order} 
                        onUpdateItemStatus={updateItemStatus}
                        onRevertItemStatus={revertItemStatus}
                        onMoveOrder={handleMoveOrder}
                        isFirst={index === 0}
                        isLast={index === orderList.length - 1}
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
          {renderOrderList(pendingOrders, 'pending')}
        </TabsContent>
        <TabsContent value="completed">
          {renderOrderList(completedOrders, 'completed')}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
