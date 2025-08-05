
"use client"

import { useState, useEffect, useCallback } from 'react';
import { type Order, type OrderItem } from "@/lib/types";
import { toast } from "sonner";
import { useI18n } from "@/context/i18n-context";
import { getInitialOrders, updateOrderItemStatus as mockUpdateItem, updateOrderStatus as mockUpdateStatus, toggleOrderPin as mockTogglePin } from "@/lib/mock-data";

const statusSequence: ('New' | 'Cooking' | 'Ready' | 'Served')[] = ['New', 'Cooking', 'Ready', 'Served'];

const parseOrderDates = (orders: Order[]): Order[] => {
  return orders.map(order => ({
    ...order,
    createdAt: new Date(order.createdAt),
    completedAt: order.completedAt ? new Date(order.completedAt) : undefined,
  }));
};

const isOrderCompleted = (order: Order) => order.items.every(item => item.status === 'Served');


export const useOrders = () => {
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
        toast.error(t('toast.error'), { description: t('kds.toast.fetch_error'), duration: 3000 });
        } finally {
        setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);
  
    const updateItemStatus = useCallback(async (orderId: number, itemId: string) => {
        const originalOrders = JSON.parse(JSON.stringify(orders)); // Deep copy for revert
        let updatedOrder: Order | undefined;

        const newOrders = orders.map(o => {
            if (o.id !== orderId) return o;

            const item = o.items.find(i => i.id === itemId);
            if (!item) return o;

            const currentIndex = statusSequence.indexOf(item.status);
            const nextStatus = statusSequence[currentIndex + 1];

            if (!nextStatus) return o; // Already at the end of the sequence

            const newItems = o.items.map(i => i.id === itemId ? { ...i, status: nextStatus } : i);
            
            updatedOrder = { ...o, items: newItems };

            if (isOrderCompleted(updatedOrder)) {
                updatedOrder.status = 'completed';
            }

            return updatedOrder;
        });

        setOrders(newOrders);

        if (!updatedOrder) return;
        
        const itemToUpdate = updatedOrder.items.find(i => i.id === itemId);
        if (!itemToUpdate) return;
        
        try {
            await mockUpdateItem(orderId, itemId, itemToUpdate.status);
            
            if (updatedOrder.status === 'completed') {
                await mockUpdateStatus({ orderId, newStatus: 'completed' });
            }
        } catch (error: any) {
            toast.error(t('toast.error'), { description: error.message || t('kds.toast.update_item_error'), duration: 3000 });
            setOrders(parseOrderDates(originalOrders));
        }
    }, [orders, t]);

    const revertItemStatus = useCallback(async (orderId: number, itemId: string) => {
        const originalOrders = JSON.parse(JSON.stringify(orders));
        
        const order = orders.find(o => o.id === orderId);
        if (!order) return;
        
        const itemIndex = order.items.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return;

        const newOrders = [...orders];
        newOrders[newOrders.findIndex(o => o.id === orderId)] = {
            ...order,
            status: 'pending',
            items: order.items.map((item, index) =>
                index === itemIndex
                    ? { ...item, status: 'New' }
                    : item
            )
        };

        setOrders(newOrders);

        try {
            await mockUpdateItem(orderId, itemId, 'New');
            if (order.status === 'completed') {
                await mockUpdateStatus({ orderId, newStatus: 'pending' });
            }
        } catch (error: any) {
            toast.error(t('toast.error'), { description: error.message || t('kds.toast.revert_item_error'), duration: 3000 });
            setOrders(parseOrderDates(originalOrders));
        }
    }, [orders, t]);
    
    const togglePinOrder = useCallback(async (orderId: number) => {
        const originalOrders = [...orders];
        const orderToPin = orders.find(o => o.id === orderId);
        if (!orderToPin) return;

        const newPinState = !orderToPin.isPinned;
        
        setOrders(currentOrders => currentOrders.map(o => o.id === orderId ? { ...o, isPinned: newPinState } : o));

        try {
        await mockTogglePin({ orderId, isPinned: newPinState });
        } catch (error: any) {
        toast.error(t('toast.error'), { description: error.message || t('kds.toast.pin_error'), duration: 3000 });
        setOrders(originalOrders);
        }
    }, [orders, t]);

    return {
        orders,
        setOrders,
        loading,
        fetchOrders,
        updateItemStatus,
        revertItemStatus,
        togglePinOrder
    }
}
