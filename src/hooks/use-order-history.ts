
"use client"

import { useState, useEffect, useCallback } from 'react';
import { type Order } from "@/lib/types";
import { toast } from "sonner";
import { useI18n } from "@/context/i18n-context";
import { getInitialOrders } from "@/lib/mock-data";

const parseOrderDates = (orders: Order[]): Order[] => {
  return orders.map(order => ({
    ...order,
    createdAt: new Date(order.createdAt),
    completedAt: order.completedAt ? new Date(order.completedAt) : undefined,
  }));
};

export const useOrderHistory = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useI18n();

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const initialOrders = await getInitialOrders();
            setOrders(parseOrderDates(initialOrders));
        } catch (error) {
            console.error("Failed to fetch orders:", error);
            toast.error(t('toast.error'), { description: t('orders.toast.fetch_error'), duration: 3000 });
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);
  
    return {
        orders,
        loading,
        fetchOrders
    }
}
