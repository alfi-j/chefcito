
"use client"

import { useCallback } from 'react';
import { toast } from "sonner";
import { useI18n } from '@/context/i18n-context';
import { useData } from '@/context/data-context';
import { 
  addMenuItem, 
  updateMenuItem, 
  deleteMenuItem,
  deleteMenuItems,
  updatePaymentMethod as mockUpdatePaymentMethod,
  addPaymentMethod as mockAddPaymentMethod,
  deletePaymentMethod as mockDeletePaymentMethod,
  addInventoryItem as mockAddInventoryItem,
  updateInventoryItem as mockUpdateInventoryItem,
  adjustInventoryStock as mockAdjustInventoryStock,
  deleteInventoryItem as mockDeleteInventoryItem,
  updateMenuItemOrder,
} from '@/lib/mock-data';
import { type MenuItem, type PaymentMethod, type InventoryItem } from "@/lib/types"

export const useMenu = () => {
  const { t } = useI18n();
  const {
    menuItems,
    categories,
    paymentMethods,
    customers,
    inventoryItems,
    loading,
    forceCacheRefresh
  } = useData();
  
  const handleSaveItem = useCallback(async (itemData: MenuItem | Omit<MenuItem, 'id'>) => {
    const isEditMode = 'id' in itemData;
    try {
      if (isEditMode) {
        await updateMenuItem(itemData as MenuItem);
      } else {
        await addMenuItem(itemData as Omit<MenuItem, 'id'>);
      }
      await forceCacheRefresh();
      toast.success(t('toast.success'), { description: t(isEditMode ? 'restaurant.toast.item_updated' : 'restaurant.toast.item_added'), duration: 3000 });
    } catch(error: any) {
      toast.error(t('toast.error'), { description: error.message || t(isEditMode ? 'restaurant.toast.update_item_error' : 'restaurant.toast.add_item_error'), duration: 3000 });
    }
  }, [forceCacheRefresh, t]);

  const handleDeleteItem = useCallback(async (itemId: string) => {
     try {
      await deleteMenuItem(itemId);
      await forceCacheRefresh();
      toast.success(t('toast.success'), { description: t('restaurant.toast.item_deleted'), duration: 3000 });
    } catch (error: any) {
       toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.delete_item_error'), duration: 3000 });
    }
  }, [forceCacheRefresh, t]);
  
  const handleDeleteMultipleItems = useCallback(async (itemIds: string[]) => {
     try {
      const count = itemIds.length;
      await deleteMenuItems(itemIds);
      await forceCacheRefresh();
      toast.success(t('toast.success'), { description: t('restaurant.toast.items_deleted', { count }), duration: 3000 });
    } catch (error: any) {
       toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.delete_item_error'), duration: 3000 });
    }
  }, [forceCacheRefresh, t]);

  const handleReorderItems = useCallback(async (reorderedItems: MenuItem[]) => {
    const orderedIds = reorderedItems.map(item => item.id);
    try {
      await updateMenuItemOrder(orderedIds);
       await forceCacheRefresh();
    } catch(error: any) {
       await forceCacheRefresh(); // Re-fetch to revert optimistic update
       toast.error(t('toast.error'), { description: t('restaurant.toast.reorder_error'), duration: 3000 });
    }
  }, [forceCacheRefresh, t]);

  const handleCategoriesUpdate = useCallback(async () => {
    await forceCacheRefresh();
  }, [forceCacheRefresh])

  const handlePaymentMethodToggle = useCallback(async (id: string, enabled: boolean) => {
    try {
      const method = paymentMethods.find(m => m.id === id);
      if(method) {
        await mockUpdatePaymentMethod({ ...method, enabled });
        await forceCacheRefresh();
        toast.success(t('toast.success'), { description: t('restaurant.toast.payment_method_updated'), duration: 3000 });
      }
    } catch(error: any) {
      toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.payment_method_update_error'), duration: 3000 });
    }
  }, [paymentMethods, forceCacheRefresh, t]);

  const handleSavePaymentMethod = useCallback(async (methodData: PaymentMethod | Omit<PaymentMethod, 'id'>) => {
     const isEditMode = 'id' in methodData;
     try {
        if (isEditMode) {
          await mockUpdatePaymentMethod(methodData as PaymentMethod);
        } else {
          await mockAddPaymentMethod(methodData as Omit<PaymentMethod, 'id'>);
        }
        await forceCacheRefresh();
        toast.success(t('toast.success'), { description: t(isEditMode ? 'restaurant.toast.payment_method_updated' : 'restaurant.toast.payment_method_added'), duration: 3000 });
     } catch (error: any) {
        toast.error(t('toast.error'), { description: error.message || t(isEditMode ? 'restaurant.toast.payment_method_update_error' : 'restaurant.toast.payment_method_add_error'), duration: 3000 });
     }
  }, [forceCacheRefresh, t]);

  const handleDeletePaymentMethod = useCallback(async (id: string) => {
    try {
      await mockDeletePaymentMethod(id);
      await forceCacheRefresh();
      toast.success(t('toast.success'), { description: t('restaurant.toast.payment_method_deleted'), duration: 3000 });
    } catch(error: any) {
      toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.payment_method_delete_error'), duration: 3000 });
    }
  }, [forceCacheRefresh, t]);

  const handleSaveInventoryItem = useCallback(async (itemData: InventoryItem | Omit<InventoryItem, 'id' | 'lastRestocked'>) => {
    const isEditMode = 'id' in itemData;
    try {
      if (isEditMode) {
        await mockUpdateInventoryItem(itemData as InventoryItem);
      } else {
        await mockAddInventoryItem(itemData as Omit<InventoryItem, 'id' | 'lastRestocked'>);
      }
      await forceCacheRefresh();
      toast.success(t('toast.success'), { description: t(isEditMode ? 'restaurant.toast.inventory_item_updated' : 'restaurant.toast.inventory_item_added'), duration: 3000 });
    } catch (error: any) {
      toast.error(t('toast.error'), { description: error.message || t(isEditMode ? 'restaurant.toast.inventory_item_update_error' : 'restaurant.toast.inventory_item_add_error'), duration: 3000 });
    }
  }, [forceCacheRefresh, t]);
  
  const handleAdjustInventoryStock = useCallback(async (itemId: string, adjustment: number) => {
    try {
      await mockAdjustInventoryStock(itemId, adjustment);
      await forceCacheRefresh();
    } catch (error: any) {
      toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.inventory_stock_update_error'), duration: 3000 });
      await forceCacheRefresh();
    }
  }, [forceCacheRefresh, t])

  const handleDeleteInventoryItem = useCallback(async (itemId: string) => {
     try {
      await mockDeleteInventoryItem(itemId);
      await forceCacheRefresh();
      toast.success(t('toast.success'), { description: t('restaurant.toast.inventory_item_deleted'), duration: 3000 });
    } catch (error: any) {
       toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.inventory_item_delete_error'), duration: 3000 });
    }
  }, [forceCacheRefresh, t]);

  return {
    menuItems,
    categories,
    paymentMethods,
    customers,
    inventoryItems,
    loading,
    handleSaveItem,
    handleDeleteItem,
    handleDeleteMultipleItems,
    handleReorderItems,
    handleCategoriesUpdate,
    handleSavePaymentMethod,
    handleDeletePaymentMethod,
    handlePaymentMethodToggle,
    handleSaveInventoryItem,
    handleAdjustInventoryStock,
    handleDeleteInventoryItem,
  };
};
