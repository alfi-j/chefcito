
"use client"

import { useState, useEffect, useCallback } from 'react';
import { type Order, type OrderItem } from "@/lib/types";
import { toast } from "sonner";
import { useI18n } from "@/context/i18n-context";
import { getInitialOrders, updateOrderItemStatus as mockUpdateItem, updateOrderStatus as mockUpdateStatus, toggleOrderPin as mockTogglePin } from "@/lib/mock-data";

const statusSequence: ('New' | 'Cooking' | 'Ready')[] = ['New', 'Cooking', 'Ready'];

const parseOrderDates = (orders: Order[]): Order[] => {
  return orders.map(order => ({
    ...order,
    createdAt: new Date(order.createdAt),
    completedAt: order.completedAt ? new Date(order.completedAt) : undefined,
  }));
};

const isOrderCompleted = (order: Order) => order.items.every(item => item.quantity === 0 && item.cookedCount > 0);


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

        // Optimistic Update
        const newOrders = orders.map(o => {
        if (o.id !== orderId) return o;
        
        const item = o.items.find(i => i.id === itemId);
        if (!item || item.status === 'Ready') return o;

        const currentIndex = statusSequence.indexOf(item.status);
        const nextStatus = statusSequence[currentIndex + 1];

        let newQuantity = item.quantity;
        let newCookedCount = item.cookedCount;
        let statusForRemaining = item.status;

        if (nextStatus === 'Ready') {
            newQuantity -= 1;
            newCookedCount += 1;
            statusForRemaining = newQuantity > 0 ? 'New' : 'Ready';
        }
        
        const newItems = o.items.map(i => {
            if (i.id !== itemId) return i;
            return { ...i, status: nextStatus === 'Ready' ? statusForRemaining : nextStatus, quantity: newQuantity, cookedCount: newCookedCount };
        });

        updatedOrder = { ...o, items: newItems };
        if (isOrderCompleted(updatedOrder)) {
            updatedOrder.status = 'completed';
        }
        return updatedOrder;
        });

        setOrders(newOrders);
        // End Optimistic Update

        // Mock Backend Call
        if (!updatedOrder) return;
        
        const itemToUpdate = updatedOrder.items.find(i => i.id === itemId);
        if (!itemToUpdate) return;
        
        try {
        await mockUpdateItem({
            itemId, 
            newStatus: itemToUpdate.status,
            newQuantity: itemToUpdate.quantity, 
            newCookedCount: itemToUpdate.cookedCount
        });

        if (updatedOrder.status === 'completed') {
            await mockUpdateStatus({ orderId, newStatus: 'completed' });
        }

        } catch (error: any) {
            toast.error(t('toast.error'), { description: error.message || t('kds.toast.update_item_error'), duration: 3000 });
            setOrders(parseOrderDates(originalOrders));
        }
    }, [orders, t]);

    const revertItemStatus = useCallback(async (orderId: number, itemId: string) => {
        const originalOrders = JSON.parse(JSON.stringify(orders)); // Deep copy for revert
        
        const order = orders.find(o => o.id === orderId);
        if (!order) return;
        const item = order.items.find(i => i.id === itemId);
        if (!item || item.cookedCount <= 0) return;

        // Optimistic Update
        const newQuantity = item.quantity + 1;
        const newCookedCount = item.cookedCount - 1;

        const newOrders = orders.map(o => {
            if (o.id !== orderId) return o;
            return {
                ...o,
                status: 'pending', // Revert order to pending if it was completed
                items: o.items.map(i => {
                    if (i.id !== itemId) return i;
                    return { ...i, status: 'New', quantity: newQuantity, cookedCount: newCookedCount };
                })
            };
        });

        setOrders(newOrders);
        // End Optimistic Update

        // Mock Backend Call
        try {
        await mockUpdateItem({ itemId, newStatus: 'New', newQuantity, newCookedCount });
        if (order.status === 'completed') {
            await mockUpdateStatus({ orderId, newStatus: 'pending' });
        }
        } catch (error: any) {
        toast.error(t('toast.error'), { description: error.message || t('kds.toast.revert_item_error'), duration: 3000 });
        setOrders(parseOrderDates(originalOrders)); // Revert on error
        }
    }, [orders, t]);
    
    const togglePinOrder = useCallback(async (orderId: number) => {
        const originalOrders = [...orders];
        const orderToPin = orders.find(o => o.id === orderId);
        if (!orderToPin) return;

        const newPinState = !orderToPin.isPinned;
        
        // Optimistic Update
        setOrders(currentOrders => currentOrders.map(o => o.id === orderId ? { ...o, isPinned: newPinState } : o));

        // Mock backend call
        try {
        await mockTogglePin({ orderId, isPinned: newPinState });
        } catch (error: any) {
        toast.error(t('toast.error'), { description: error.message || t('kds.toast.pin_error'), duration: 3000 });
        setOrders(originalOrders);
        }
    }, [orders, t]);

    return {
        orders,
        setOrders, // Expose for drag-and-drop optimistic updates
        loading,
        fetchOrders,
        updateItemStatus,
        revertItemStatus,
        togglePinOrder
    }
}
