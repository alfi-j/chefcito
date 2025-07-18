"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { OrderCard } from "./components/order-card";
import { initialOrders, type Order } from "@/lib/data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card";

const isOrderCompleted = (order: Order) => order.items.every(item => item.status === 'Cooked');

export default function KdsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    // Sort orders by creation time on initial load
    const sortedInitialOrders = [...initialOrders].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    setOrders(sortedInitialOrders);
  }, []);

  const updateItemStatus = useCallback((orderId: number, itemId: string, newStatus: 'New' | 'Cooking' | 'Cooked') => {
    setOrders(currentOrders => {
      const updatedOrders = currentOrders.map(order => {
        if (order.id === orderId) {
          const updatedItems = order.items.map(item =>
            item.id === itemId ? { ...item, status: newStatus } : item
          );
          
          const newOrder = {
            ...order,
            items: updatedItems,
          };
          
          // Update the top-level order status
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
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 3xl:columns-6 gap-2 space-y-2 py-4">
            {orderList.map(order => (
                <div key={order.id} className="break-inside-avoid">
                    <OrderCard order={order} onUpdateItemStatus={updateItemStatus} />
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
