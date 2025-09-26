
"use client"

import { useState, useEffect, useCallback } from 'react';
import { type Order } from "@/lib/types";
import { toast } from "sonner";
import { useI18n } from "@/context/i18n-context";
import { ordersApi } from "@/lib/api-client";
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
            const fetchedOrders = await ordersApi.getAll();
            setOrders(fetchedOrders);
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
        
        // Update the order in the backend
        if (updatedOrder) {
            try {
                const updateData: any = {
                    id: String(updatedOrder.id),
                    status: updatedOrder.status,
                    table: updatedOrder.table,
                    isPinned: updatedOrder.isPinned,
                    customerId: updatedOrder.customerId,
                    staffName: updatedOrder.staffName,
                    notes: updatedOrder.notes,
                    orderType: updatedOrder.orderType,
                    deliveryInfo: updatedOrder.deliveryInfo
                };

                // Only include properties that are actually defined
                Object.keys(updateData).forEach(key => {
                    if (updateData[key] === undefined) {
                        delete updateData[key];
                    }
                });

                await ordersApi.update(updateData);
            } catch (error) {
                // Revert the change if the API call fails
                setOrders(originalOrders);
                toast.error(t('toast.error'), { description: t('kds.toast.update_error'), duration: 3000 });
            }
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
                const updateData: any = {
                    id: String(updatedOrder.id),
                    status: updatedOrder.status,
                    table: updatedOrder.table,
                    isPinned: updatedOrder.isPinned,
                    customerId: updatedOrder.customerId,
                    staffName: updatedOrder.staffName,
                    notes: updatedOrder.notes,
                    orderType: updatedOrder.orderType,
                    deliveryInfo: updatedOrder.deliveryInfo
                };

                // Only include properties that are actually defined
                Object.keys(updateData).forEach(key => {
                    if (updateData[key] === undefined) {
                        delete updateData[key];
                    }
                });

                await ordersApi.update(updateData);
            }
        } catch (error: any) {
            toast.error(t('toast.error'), { description: error.message || t('kds.toast.revert_item_error'), duration: 3000 });
            setOrders(originalOrders);
        }
    }, [orders, t]);
    
    const updateOrderStatus = useCallback(async (orderId: number, status: Order['status']) => {
        try {
            const orderToUpdate = orders.find(o => o.id === orderId);
            if (orderToUpdate) {
                const updatedOrder = { ...orderToUpdate, status };
                const updateData: any = {
                    id: String(updatedOrder.id),
                    status: updatedOrder.status,
                    table: updatedOrder.table,
                    isPinned: updatedOrder.isPinned,
                    customerId: updatedOrder.customerId,
                    staffName: updatedOrder.staffName,
                    notes: updatedOrder.notes,
                    orderType: updatedOrder.orderType,
                    deliveryInfo: updatedOrder.deliveryInfo
                };

                // Only include properties that are actually defined
                Object.keys(updateData).forEach(key => {
                    if (updateData[key] === undefined) {
                        delete updateData[key];
                    }
                });

                await ordersApi.update(updateData);
                setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
            }
        } catch (error) {
            toast.error(t('toast.error'), { description: t('kds.toast.update_error'), duration: 3000 });
        }
    }, [orders, t]);

    const toggleOrderPin = useCallback(async (orderId: number) => {
        try {
            const orderToUpdate = orders.find(o => o.id === orderId);
            if (orderToUpdate) {
                const updatedOrder = { ...orderToUpdate, isPinned: !orderToUpdate.isPinned };
                const updateData: any = {
                    id: String(updatedOrder.id),
                    status: updatedOrder.status,
                    table: updatedOrder.table,
                    isPinned: updatedOrder.isPinned,
                    customerId: updatedOrder.customerId,
                    staffName: updatedOrder.staffName,
                    notes: updatedOrder.notes,
                    orderType: updatedOrder.orderType,
                    deliveryInfo: updatedOrder.deliveryInfo
                };

                // Only include properties that are actually defined
                Object.keys(updateData).forEach(key => {
                    if (updateData[key] === undefined) {
                        delete updateData[key];
                    }
                });

                await ordersApi.update(updateData);
                setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
            }
        } catch (error) {
            toast.error(t('toast.error'), { description: t('kds.toast.update_error'), duration: 3000 });
        }
    }, [orders, t]);

    const createOrder = useCallback(async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            const newOrder = await ordersApi.create(orderData);
            setOrders(prev => [newOrder, ...prev]);
            toast.success(t('toast.success'), { description: t('pos.toast.order_created'), duration: 3000 });
            return newOrder;
        } catch (error) {
            toast.error(t('toast.error'), { description: t('pos.toast.order_error'), duration: 3000 });
            return null;
        }
    }, [t]);

    const deleteOrder = useCallback(async (orderId: number) => {
        try {
            await ordersApi.delete(String(orderId));
            setOrders(prev => prev.filter(o => o.id !== orderId));
            toast.success(t('toast.success'), { description: t('kds.toast.order_deleted'), duration: 3000 });
        } catch (error) {
            toast.error(t('toast.error'), { description: t('kds.toast.delete_error'), duration: 3000 });
        }
    }, [t]);

    return {
        orders,
        loading,
        updateItemStatus,
        updateOrderStatus,
        revertItemStatus,
        toggleOrderPin,
        createOrder,
        deleteOrder,
        refreshOrders: fetchOrders
    };
};
