<<<<<<< HEAD
=======

>>>>>>> d3399ff (Chefcito Beta!)
"use client"

import { useState, useEffect, useCallback } from 'react';
import { type Order } from "@/lib/types";
import { toast } from "sonner";
import { useI18n } from "@/context/i18n-context";
<<<<<<< HEAD
import { useData } from '@/context/data-context';

=======
import { ordersApi } from "@/lib/api-client";
import { useData } from '@/context/data-context';


>>>>>>> d3399ff (Chefcito Beta!)
const isOrderReadyForServing = (order: Order) => order.items.some(item => item.readyCount > 0 || item.servedCount > 0);

export const useOrders = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useI18n();
    const { menuItems, forceCacheRefresh } = useData();

    const fetchOrders = useCallback(async () => {
<<<<<<< HEAD
      setLoading(true);
      try {
        const response = await fetch('/api/orders');
        if (!response.ok) throw new Error('Failed to fetch orders');
        
        const ordersData = await response.json();
        setOrders(ordersData);
      } catch (error: any) {
        console.error('Error fetching orders:', error);
        toast.error(t('toast.error'), { 
          description: error.message || t('pos.toast.fetch_error'), 
          duration: 3000 
        });
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }, [t]);

    const addOrder = useCallback(async (order: Omit<Order, 'id' | 'createdAt' | 'statusHistory'>) => {
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...order,
            status: 'pending',
            statusHistory: [{ status: 'pending', timestamp: new Date().toISOString() }]
          }),
        });
        
        if (!response.ok) throw new Error('Failed to add order');
        
        const newOrder = await response.json();
        setOrders(prev => [newOrder, ...prev]);
        return newOrder;
      } catch (error: any) {
        console.error('Error adding order:', error);
        toast.error(t('toast.error'), { 
          description: error.message || t('pos.toast.add_error'), 
          duration: 3000 
        });
        throw error;
      }
    }, [t]);
  
=======
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

>>>>>>> d3399ff (Chefcito Beta!)
    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);
  
<<<<<<< HEAD
    const updateItemStatus = useCallback(async ({ 
      orderId, 
      itemId, 
      newStatus 
    }: { 
      orderId: number; 
      itemId: string; 
      newStatus: 'cooking' | 'ready' | 'served' 
    }) => {
      setOrders(prev => {
        return prev.map(order => {
          if (order.id === orderId) {
            const updatedItems = order.items.map(item => {
              if (item.id === itemId) {
                const updatedItem = { ...item };
                switch (newStatus) {
                  case 'cooking':
                    updatedItem.newCount = Math.max(0, updatedItem.newCount - 1);
                    updatedItem.cookingCount = updatedItem.cookingCount + 1;
                    break;
                  case 'ready':
                    updatedItem.cookingCount = Math.max(0, updatedItem.cookingCount - 1);
                    updatedItem.readyCount = updatedItem.readyCount + 1;
                    break;
                  case 'served':
                    updatedItem.readyCount = Math.max(0, updatedItem.readyCount - 1);
                    updatedItem.servedCount = updatedItem.servedCount + 1;
                    break;
                }
                return updatedItem;
              }
              return item;
            });
            
            return { ...order, items: updatedItems };
          }
          return order;
        });
      });

      try {
        const response = await fetch(`/api/orders/${orderId}/items/${itemId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) throw new Error('Failed to update order item status');
      } catch (error: any) {
        toast.error(t('toast.error'), { description: error.message || t('kds.toast.status_error'), duration: 3000 });
        // Revert the optimistic update
        fetchOrders();
      }
=======
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
>>>>>>> d3399ff (Chefcito Beta!)
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
<<<<<<< HEAD
            const response = await fetch(`/api/orders/${orderId}/status`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ status: updatedOrder.status }),
            });
            
            if (!response.ok) throw new Error('Failed to update order status');
=======
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
>>>>>>> d3399ff (Chefcito Beta!)
        } catch (error: any) {
            toast.error(t('toast.error'), { description: error.message || t('kds.toast.revert_item_error'), duration: 3000 });
            setOrders(originalOrders);
        }
    }, [orders, t]);
    
<<<<<<< HEAD
    const togglePinOrder = useCallback(async (orderId: number) => {
        const originalOrders = [...orders];
        const orderToPin = orders.find(o => o.id === orderId);
        if (!orderToPin) return;

        const newPinState = !orderToPin.isPinned;
        
        setOrders(currentOrders => currentOrders.map(o => o.id === orderId ? { ...o, isPinned: newPinState } : o));

        try {
          const response = await fetch(`/api/orders/${orderId}/pin`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isPinned: newPinState }),
          });
          
          if (!response.ok) throw new Error('Failed to toggle order pin');
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
        addOrder,
        updateItemStatus,
        revertItemStatus,
        togglePinOrder
    }
}
=======
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
>>>>>>> d3399ff (Chefcito Beta!)
