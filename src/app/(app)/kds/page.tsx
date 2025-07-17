"use client";
import { useState, useEffect } from "react";
import { OrderCard } from "./components/order-card";
import { initialOrders, type Order } from "@/lib/data";

export default function KdsPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    // Sort orders by creation time on initial load
    const sortedOrders = [...initialOrders].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    setOrders(sortedOrders);
  }, []);

  const updateItemStatus = (orderId: number, itemId: string, newStatus: 'New' | 'Cooking' | 'Cooked') => {
    setOrders(currentOrders =>
      currentOrders.map(order => {
        if (order.id === orderId) {
          const updatedItems = order.items.map(item =>
            item.id === itemId ? { ...item, status: newStatus } : item
          );
          return {
            ...order,
            items: updatedItems,
          };
        }
        return order;
      })
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {orders.map(order => (
        <OrderCard key={order.id} order={order} onUpdateItemStatus={updateItemStatus} />
      ))}
    </div>
  );
}
