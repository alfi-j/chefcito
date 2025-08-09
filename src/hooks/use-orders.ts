
"use client"

import { useState, useEffect, useCallback } from 'react';
import { type Order } from "@/lib/types";
import { toast } from "sonner";
import { useI18n } from "@/context/i18n-context";
import { getInitialOrders, updateOrderStatus as mockUpdateStatus, toggleOrderPin as mockTogglePin } from "@/lib/mock-data";
import { useData } from '@/context/data-context';


const isOrderReadyForServing = (order: Order) => order.items.some(item => item.readyCount > 0 || item.servedCount > 0);

export const useOrders = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useI18n();
    const { menuItems, forceCacheRefresh } = useData();

    const fetchOrders = useCallback(async () => {
        if (menuItems.length === 0) return;
        try {
            setLoading(true);
            const initialOrders = await getInitialOrders(menuItems);
            setOrders(initialOrders);
        } catch (error) {
            console.error("Failed to fetch orders:", error);
            toast.error(t('toast.error'), { description: t('kds.toast.fetch_error'), duration: 3000 });
        } finally {
            setLoading(false);
        }
    }, [t, menuItems]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);
  
    const updateItemStatus = useCallback(async (orderId: number, itemId: string, fromStatus: 'New' | 'Cooking' | 'Serve') => {
        const originalOrders = JSON.parse(JSON.stringify(orders));
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
            } else if (fromStatus === 'Serve' && item.readyCount > 0) {
                item.readyCount -= 1;
                item.servedCount += 1;
            } else {
                return o;
            }
            
            newItems[itemIndex] = item;
            updatedOrder = { ...o, items: newItems };
            
            if (isOrderReadyForServing(updatedOrder)) {
                updatedOrder.status = 'completed';
            } else {
                updatedOrder.status = 'pending';
            }
            
            return updatedOrder;
        });

        setOrders(newOrders);

        if (!updatedOrder) return;
        
        try {
            const originalOrder = originalOrders.find((o: Order) => o.id === orderId);
            if (updatedOrder.status !== originalOrder?.status) {
                await mockUpdateStatus({ orderId, newStatus: updatedOrder.status });
            }
        } catch (error: any) {
            toast.error(t('toast.error'), { description: error.message || t('kds.toast.update_item_error'), duration: 3000 });
            setOrders(originalOrders);
        }
    }, [orders, t]);


    const revertItemStatus = useCallback(async (orderId: number, itemId: string, toStatus: 'New' | 'Cooking' | 'Serve') => {
        const originalOrders = JSON.parse(JSON.stringify(orders));
        let updatedOrder: Order | undefined;

        const newOrders = orders.map(o => {
            if (o.id !== orderId) return o;

            const newItems = [...o.items];
            const itemIndex = newItems.findIndex(i => i.id === itemId);
            if (itemIndex === -1) return o;

            const item = { ...newItems[itemIndex] };
            
            if (toStatus === 'New' && item.cookingCount > 0) {
                item.cookingCount -= 1;
                item.newCount += 1;
            } else if (toStatus === 'Cooking' && item.readyCount > 0) {
                item.readyCount -= 1;
                item.cookingCount += 1;
            } else if (toStatus === 'Serve' && item.servedCount > 0) {
                item.servedCount -= 1;
                item.readyCount += 1;
            } else {
                return o;
            }

            newItems[itemIndex] = item;
            updatedOrder = { ...o, items: newItems };
            
            if (isOrderReadyForServing(updatedOrder)) {
                updatedOrder.status = 'completed';
            } else {
                updatedOrder.status = 'pending';
            }

            return updatedOrder;
        });
        
        setOrders(newOrders);

        if (!updatedOrder) return;

        try {
            const originalOrder = originalOrders.find((o: Order) => o.id === orderId);
            if (updatedOrder.status !== originalOrder?.status) {
                await mockUpdateStatus({ orderId, newStatus: updatedOrder.status });
            }
        } catch (error: any) {
            toast.error(t('toast.error'), { description: error.message || t('kds.toast.revert_item_error'), duration: 3000 });
            setOrders(originalOrders);
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
