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
    <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-2 space-y-2">
      {orders.map(order => (
        <div key={order.id} className="break-inside-avoid">
          <OrderCard order={order} onUpdateItemStatus={updateItemStatus} />
        </div>
      ))}
    </div>
  );
}
