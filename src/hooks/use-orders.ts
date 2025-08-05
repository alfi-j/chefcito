
"use client"

import { useState, useEffect, useCallback } from 'react';
import { type Order, type OrderItem } from "@/lib/types";
import { toast } from "sonner";
import { useI18n } from "@/context/i18n-context";
import { getInitialOrders, updateOrderItemStatus as mockUpdateItem, updateOrderStatus as mockUpdateStatus, toggleOrderPin as mockTogglePin } from "@/lib/mock-data";


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

            const item = newItems[itemIndex];
            
            if (fromStatus === 'New' && item.newCount > 0) {
                newItems[itemIndex] = { ...item, newCount: item.newCount - 1, cookingCount: item.cookingCount + 1 };
            } else if (fromStatus === 'Cooking' && item.cookingCount > 0) {
                newItems[itemIndex] = { ...item, cookingCount: item.cookingCount - 1, readyCount: item.readyCount + 1 };
            } else {
                return o; // No change
            }

            updatedOrder = { ...o, items: newItems };

            if (isOrderReadyForCompletion(updatedOrder)) {
                updatedOrder.status = 'completed';
            }
            
            return updatedOrder;
        });

        setOrders(newOrders);

        if (!updatedOrder) return;
        
        try {
            // In a real app, you would send the specific change to the backend.
            // For this mock, we'll just log it. The mock-data functions aren't granular enough.
            console.log(`Updated status for item ${itemId} in order ${orderId}`);
            
            if (updatedOrder.status === 'completed' && originalOrders.find((o: Order) => o.id === orderId)?.status !== 'completed') {
                await mockUpdateStatus({ orderId, newStatus: 'completed' });
            }
        } catch (error: any) {
            toast.error(t('toast.error'), { description: error.message || t('kds.toast.update_item_error'), duration: 3000 });
            setOrders(parseOrderDates(originalOrders));
        }
    }, [orders, t]);


    const revertItemStatus = useCallback(async (orderId: number, itemId: string, toStatus: 'New' | 'Cooking') => {
        const originalOrders = JSON.parse(JSON.stringify(orders));
        
        const order = orders.find(o => o.id === orderId);
        if (!order) return;
        
        const itemIndex = order.items.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return;

        const itemToRevert = order.items[itemIndex];
        const newItems = [...order.items];

        if (toStatus === 'Cooking' && itemToRevert.readyCount > 0) {
            newItems[itemIndex] = { ...itemToRevert, readyCount: itemToRevert.readyCount - 1, cookingCount: itemToRevert.cookingCount + 1 };
        } else if (toStatus === 'New' && itemToRevert.cookingCount > 0) {
            newItems[itemIndex] = { ...itemToRevert, cookingCount: itemToRevert.cookingCount - 1, newCount: itemToRevert.newCount + 1 };
        } else {
            return; // No change
        }
        
        const newOrder = { ...order, items: newItems, status: 'pending' };

        const newOrdersState = orders.map(o => o.id === orderId ? newOrder : o);
        setOrders(newOrdersState);

        try {
            console.log(`Reverted status for item ${itemId} in order ${orderId}`);
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
