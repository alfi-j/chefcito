
"use client"

import { useState, useEffect, useCallback } from 'react';
import { type Order, type OrderItem } from "@/lib/types";
import { toast } from "sonner";
import { useI18n } from "@/context/i18n-context";
import { getInitialOrders, updateOrderStatus as mockUpdateStatus, toggleOrderPin as mockTogglePin } from "@/lib/mock-data";


const parseOrderDates = (orders: Order[]): Order[] => {
  return orders.map(order => ({
    ...order,
    createdAt: new Date(order.createdAt),
    completedAt: order.completedAt ? new Date(order.completedAt) : undefined,
  }));
};

// An order is complete from the KITCHEN's perspective when all items are ready.
const isOrderReadyForCompletion = (order: Order) => order.items.every(item => item.newCount === 0 && item.cookingCount === 0);

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
  
    const updateItemStatus = useCallback(async (orderId: number, itemId: string, fromStatus: 'New' | 'Cooking') => {
        const originalOrders = JSON.parse(JSON.stringify(orders)); // Deep copy for revert
        let updatedOrder: Order | undefined;

        const newOrders = orders.map(o => {
            if (o.id !== orderId) return o;
            
            const newItems = [...o.items];
            const itemIndex = newItems.findIndex(i => i.id === itemId);
            if (itemIndex === -1) return o;

            const item = { ...newItems[itemIndex] };
            
            if (fromStatus === 'New' && item.newCount > 0) {
                item.newCount -= 1;
                item.cookingCount += 1;
            } else if (fromStatus === 'Cooking' && item.cookingCount > 0) {
                item.cookingCount -= 1;
                item.readyCount += 1;
            } else {
                return o; // No change
            }
            
            newItems[itemIndex] = item;
            updatedOrder = { ...o, items: newItems };

            if (isOrderReadyForCompletion(updatedOrder)) {
                updatedOrder.status = 'completed';
            }
            
            return updatedOrder;
        });

        setOrders(parseOrderDates(newOrders));

        if (!updatedOrder) return;
        
        try {
            console.log(`Updated status for item ${itemId} in order ${orderId}`);
            const originalOrder = originalOrders.find((o: Order) => o.id === orderId);
            if (updatedOrder.status === 'completed' && originalOrder?.status !== 'completed') {
                await mockUpdateStatus({ orderId, newStatus: 'completed' });
            }
        } catch (error: any) {
            toast.error(t('toast.error'), { description: error.message || t('kds.toast.update_item_error'), duration: 3000 });
            setOrders(parseOrderDates(originalOrders));
        }
    }, [orders, t]);


    const revertItemStatus = useCallback(async (orderId: number, itemId: string, toStatus: 'Cooking') => {
        const originalOrders = JSON.parse(JSON.stringify(orders));
        let orderToUpdate: Order | undefined;

        const newOrders = orders.map(o => {
            if (o.id !== orderId) return o;

            const newItems = [...o.items];
            const itemIndex = newItems.findIndex(i => i.id === itemId);
            if (itemIndex === -1) return o;

            const item = { ...newItems[itemIndex] };

            // When reverting, we move a unit from ready to cooking.
            // The total quantity was temporarily stored in 'quantity'.
            // The individual counts are the source of truth now.
            const totalReadyUnits = item.readyCount > 0 ? item.readyCount : item.quantity;
            
            if (toStatus === 'Cooking' && totalReadyUnits > 0) {
                item.readyCount = totalReadyUnits - 1;
                item.cookingCount += 1;
            } else {
                return o;
            }

            newItems[itemIndex] = item;
            const wasCompleted = o.status === 'completed';
            orderToUpdate = { ...o, items: newItems, status: 'pending' };

            if (wasCompleted) {
                console.log(`Order ${orderId} reverted to pending.`);
            }

            return orderToUpdate;
        });
        
        setOrders(parseOrderDates(newOrders));

        if (!orderToUpdate) return;

        try {
            console.log(`Reverted status for item ${itemId} in order ${orderId}`);
            const originalOrder = originalOrders.find((o: Order) => o.id === orderId);
            if (originalOrder && originalOrder.status === 'completed') {
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
