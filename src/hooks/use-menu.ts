
"use client"

import { useCallback } from 'react';
import { toast } from "sonner";
import { useI18n } from '@/context/i18n-context';
import { useData } from '@/context/data-context';
import { 
  menuItemsApi,
  categoriesApi,
  paymentMethodsApi,
  inventoryApi
} from '@/lib/api-client';
import { type MenuItem, type PaymentMethod, type InventoryItem, type Category } from "@/lib/types"

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
        await menuItemsApi.update(itemData as MenuItem);
      } else {
        await menuItemsApi.create(itemData as Omit<MenuItem, 'id'>);
      }
      await forceCacheRefresh();
      toast.success(t('toast.success'), { description: t(isEditMode ? 'restaurant.toast.item_updated' : 'restaurant.toast.item_added'), duration: 3000 });
    } catch(error: any) {
      toast.error(t('toast.error'), { description: error.message || t(isEditMode ? 'restaurant.toast.update_item_error' : 'restaurant.toast.add_item_error'), duration: 3000 });
    }
  }, [forceCacheRefresh, t]);

  const handleDeleteItem = useCallback(async (itemId: string) => {
     try {
      await menuItemsApi.delete(itemId);
      await forceCacheRefresh();
      toast.success(t('toast.success'), { description: t('restaurant.toast.item_deleted'), duration: 3000 });
    } catch (error: any) {
       toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.delete_item_error'), duration: 3000 });
    }
  }, [forceCacheRefresh, t]);
  
  const handleDeleteMultipleItems = useCallback(async (itemIds: string[]) => {
     try {
      await Promise.all(itemIds.map(id => menuItemsApi.delete(id)));
      await forceCacheRefresh();
      toast.success(t('toast.success'), { description: t('restaurant.toast.items_deleted', { count: itemIds.length }), duration: 3000 });
    } catch (error: any) {
       toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.delete_item_error'), duration: 3000 });
    }
  }, [forceCacheRefresh, t]);

  const handleReorderItems = useCallback(async (reorderedItems: MenuItem[]) => {
    try {
      // Update each item with its new sort index
      await Promise.all(reorderedItems.map((item, index) => 
        menuItemsApi.update({ ...item, sortIndex: index })
      ));
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
        await paymentMethodsApi.update({ ...method, enabled });
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
         await paymentMethodsApi.update(methodData as PaymentMethod);
       } else {
         await paymentMethodsApi.create(methodData as Omit<PaymentMethod, 'id'>);
       }
       await forceCacheRefresh();
       toast.success(t('toast.success'), { description: t(isEditMode ? 'restaurant.toast.payment_method_updated' : 'restaurant.toast.payment_method_added'), duration: 3000 });
     } catch(error: any) {
       toast.error(t('toast.error'), { description: error.message || t(isEditMode ? 'restaurant.toast.payment_method_update_error' : 'restaurant.toast.payment_method_add_error'), duration: 3000 });
     }
  }, [forceCacheRefresh, t]);

  const handleDeletePaymentMethod = useCallback(async (id: string) => {
     try {
      await paymentMethodsApi.delete(id);
      await forceCacheRefresh();
      toast.success(t('toast.success'), { description: t('restaurant.toast.payment_method_deleted'), duration: 3000 });
    } catch (error: any) {
       toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.payment_method_delete_error'), duration: 3000 });
    }
  }, [forceCacheRefresh, t]);

  const handleSaveInventoryItem = useCallback(async (itemData: InventoryItem | Omit<InventoryItem, 'id'>) => {
     const isEditMode = 'id' in itemData;
     try {
       if (isEditMode) {
         await inventoryApi.update(itemData as InventoryItem);
       } else {
         await inventoryApi.create(itemData as Omit<InventoryItem, 'id'>);
       }
       await forceCacheRefresh();
       toast.success(t('toast.success'), { description: t(isEditMode ? 'restaurant.toast.inventory_item_updated' : 'restaurant.toast.inventory_item_added'), duration: 3000 });
     } catch(error: any) {
       toast.error(t('toast.error'), { description: error.message || t(isEditMode ? 'restaurant.toast.inventory_item_update_error' : 'restaurant.toast.inventory_item_add_error'), duration: 3000 });
     }
  }, [forceCacheRefresh, t]);
  
  const handleAdjustInventoryStock = useCallback(async (itemId: string, adjustment: number) => {
    try {
      const item = inventoryItems.find(i => i.id === itemId);
      if (item) {
        const updatedItem = { ...item, quantity: item.quantity + adjustment };
        await inventoryApi.update(updatedItem);
        await forceCacheRefresh();
        toast.success(t('toast.success'), { description: t('restaurant.toast.inventory_adjusted'), duration: 3000 });
      }
    } catch (error: any) {
      toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.inventory_adjust_error'), duration: 3000 });
    }
  }, [inventoryItems, forceCacheRefresh, t]);

  const handleDeleteInventoryItem = useCallback(async (id: string) => {
     try {
      await inventoryApi.delete(id);
      await forceCacheRefresh();
      toast.success(t('toast.success'), { description: t('restaurant.toast.inventory_item_deleted'), duration: 3000 });
    } catch (error: any) {
       toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.inventory_item_delete_error'), duration: 3000 });
    }
  }, [forceCacheRefresh, t]);

  const handleSaveCategory = useCallback(async (categoryData: Category | Omit<Category, 'id'>) => {
     const isEditMode = 'id' in categoryData;
     try {
       if (isEditMode) {
         await categoriesApi.update(categoryData as Category);
       } else {
         await categoriesApi.create(categoryData as Omit<Category, 'id'>);
       }
       await forceCacheRefresh();
       toast.success(t('toast.success'), { description: t(isEditMode ? 'restaurant.toast.category_updated' : 'restaurant.toast.category_added'), duration: 3000 });
     } catch(error: any) {
       toast.error(t('toast.error'), { description: error.message || t(isEditMode ? 'restaurant.toast.category_update_error' : 'restaurant.toast.category_add_error'), duration: 3000 });
     }
  }, [forceCacheRefresh, t]);

  const handleDeleteCategory = useCallback(async (id: number) => {
     try {
      await categoriesApi.delete(id);
      await forceCacheRefresh();
      toast.success(t('toast.success'), { description: t('restaurant.toast.category_deleted'), duration: 3000 });
    } catch (error: any) {
       toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.category_delete_error'), duration: 3000 });
    }
  }, [forceCacheRefresh, t]);

  return {
    menuItems,
    categories,
    paymentMethods,
    customers,
    inventoryItems,
    loading,
    forceCacheRefresh,
    handleSaveItem,
    handleDeleteItem,
    handleDeleteMultipleItems,
    handleReorderItems,
    handleCategoriesUpdate,
    handlePaymentMethodToggle,
    handleSavePaymentMethod,
    handleDeletePaymentMethod,
    handleSaveCategory,
    handleDeleteCategory,
    handleSaveInventoryItem,
    handleDeleteInventoryItem,
    handleAdjustInventoryStock
  };
};
