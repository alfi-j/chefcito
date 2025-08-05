
"use client"

import { useState, useEffect, useCallback } from 'react';
import { type Order, type OrderItem } from "@/lib/types";
import { toast } from "sonner";
import { useI18n } from "@/context/i18n-context";
import { getInitialOrders, updateOrderItemStatus as mockUpdateItem, updateOrderStatus as mockUpdateStatus, toggleOrderPin as mockTogglePin } from "@/lib/mock-data";

// The KDS is only concerned with these states. 'Served' is handled by front-of-house.
const kdsStatusSequence: ('New' | 'Cooking' | 'Ready')[] = ['New', 'Cooking', 'Ready'];

const parseOrderDates = (orders: Order[]): Order[] => {
  return orders.map(order => ({
    ...order,
    createdAt: new Date(order.createdAt),
    completedAt: order.completedAt ? new Date(order.completedAt) : undefined,
  }));
};

// An order is complete from the KITCHEN's perspective when all items are cooked.
const isOrderReadyForCompletion = (order: Order) => order.items.every(item => item.quantity === 0 && item.cookedCount > 0);

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
        let finalStatus: OrderItem['status'] | undefined;

        const newOrders = orders.map(o => {
            if (o.id !== orderId) return o;
            
            const newItems = [...o.items];
            const itemIndex = newItems.findIndex(i => i.id === itemId);
            if (itemIndex === -1) return o;

            const item = newItems[itemIndex];
            const currentIndex = kdsStatusSequence.indexOf(item.status);
            const nextStatus = kdsStatusSequence[currentIndex + 1];

            if (!nextStatus) return o; // Already 'Ready'
            
            finalStatus = nextStatus;

            if (nextStatus === 'Ready') {
                 // Item is cooked, move quantity to cookedCount
                newItems[itemIndex] = { 
                    ...item, 
                    status: 'Ready', 
                    cookedCount: item.cookedCount + item.quantity, 
                    quantity: 0 
                };
            } else {
                newItems[itemIndex] = { ...item, status: nextStatus };
            }

            updatedOrder = { ...o, items: newItems };

            if (isOrderReadyForCompletion(updatedOrder)) {
                updatedOrder.status = 'completed';
            }
            
            return updatedOrder;
        });

        setOrders(newOrders);

        if (!updatedOrder || !finalStatus) return;
        
        try {
            await mockUpdateItem(orderId, itemId, finalStatus);
            if (updatedOrder.status === 'completed' && originalOrders.find((o: Order) => o.id === orderId)?.status !== 'completed') {
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

        const itemToRevert = order.items[itemIndex];
        
        // This action should only be possible on items that have been cooked
        if(itemToRevert.cookedCount === 0) return;

        const newItems = [...order.items];
        newItems[itemIndex] = {
            ...itemToRevert,
            status: 'New',
            quantity: itemToRevert.cookedCount, // Move count back to quantity
            cookedCount: 0,
        };
        
        const newOrder = { ...order, items: newItems, status: 'pending' };

        const newOrdersState = orders.map(o => o.id === orderId ? newOrder : o);
        setOrders(newOrdersState);

        try {
            await mockUpdateItem(orderId, itemId, 'New');
            // If the original order was completed, we must revert its status.
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
