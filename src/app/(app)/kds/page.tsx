"use client";
import { useState, useEffect, useCallback } from "react";
import { OrderCard } from "./components/order-card";
import { initialOrders, type Order } from "@/lib/data";

const isOrderCompleted = (order: Order) => order.items.every(item => item.status === 'Cooked');

const sortOrders = (orders: Order[]) => {
  return [...orders].sort((a, b) => {
    const aCompleted = isOrderCompleted(a);
    const bCompleted = isOrderCompleted(b);

    if (aCompleted && !bCompleted) return 1; // a goes after b
    if (!aCompleted && bCompleted) return -1; // a goes before b

    // If both are same completion status, sort by time
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
};


export default function KdsPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    // Sort orders on initial load
    setOrders(sortOrders(initialOrders));
  }, []);

  const updateItemStatus = useCallback((orderId: number, itemId: string, newStatus: 'New' | 'Cooking' | 'Cooked') => {
    setOrders(currentOrders => {
      const updatedOrders = currentOrders.map(order => {
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
      });
      return sortOrders(updatedOrders);
    });
  }, []);

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
