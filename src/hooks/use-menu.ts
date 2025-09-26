<<<<<<< HEAD
"use client"

import React, { useCallback } from 'react';
import { toast } from "sonner";
import { useI18n } from '@/context/i18n-context';
import { useData } from '@/context/data-context';
import { type MenuItem, type PaymentMethod, type InventoryItem, type Category } from "@/lib/types";
=======

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
>>>>>>> d3399ff (Chefcito Beta!)

export const useMenu = () => {
  const { t } = useI18n();
  const {
    menuItems,
    categories,
    paymentMethods,
    customers,
    inventoryItems,
    loading,
<<<<<<< HEAD
    forceCacheRefresh,
  } = useData();
  
  const fetchAllData = useCallback(async () => {
    try {
      // Replace mock data loading with API calls
      const [menuItemsRes, categoriesRes] = await Promise.all([
        fetch('/api/menu-items'),
        fetch('/api/categories')
      ]);
      
      const menuItemsData = await menuItemsRes.json();
      const categoriesData = await categoriesRes.json();
      
      // Note: We're not updating the context state here because that's handled by the DataProvider
      // The component using this hook should rely on the context values directly
    } catch (error) {
      console.error('Error fetching menu data:', error);
      toast.error(t('toast.error'), { 
        description: t('restaurant.menu.fetch_error'), 
        duration: 3000 
      });
    }
  }, [t]);

  const addMenuItem = useCallback(async (item: Omit<MenuItem, 'id'>) => {
    try {
      const response = await fetch('/api/menu-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });
      
      if (!response.ok) throw new Error('Failed to add menu item');
      
      const newItem = await response.json();
      toast.success(t('toast.success'), { 
        description: t('restaurant.menu.add_success'), 
        duration: 3000 
      });
      await forceCacheRefresh();
    } catch (error) {
      console.error('Error adding menu item:', error);
      toast.error(t('toast.error'), { 
        description: t('restaurant.menu.add_error'), 
        duration: 3000 
      });
    }
  }, [t, forceCacheRefresh]);

  const updateMenuItem = useCallback(async (id: string, updates: Partial<MenuItem>) => {
    try {
      const response = await fetch(`/api/menu-items?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
      },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Failed to update menu item');
      
      const updatedItem = await response.json();
      toast.success(t('toast.success'), { 
        description: t('restaurant.menu.update_success'), 
        duration: 3000 
      });
      await forceCacheRefresh();
    } catch (error) {
      console.error('Error updating menu item:', error);
      toast.error(t('toast.error'), { 
        description: t('restaurant.menu.update_error'), 
        duration: 3000 
      });
    }
  }, [t, forceCacheRefresh]);

  const deleteMenuItem = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/menu-items?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete menu item');
      
      toast.success(t('toast.success'), { 
        description: t('restaurant.menu.delete_success'), 
        duration: 3000 
      });
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast.error(t('toast.error'), { 
        description: t('restaurant.menu.delete_error'), 
        duration: 3000 
      });
    }
  }, [t]);

=======
    forceCacheRefresh
  } = useData();
  
>>>>>>> d3399ff (Chefcito Beta!)
  const handleSaveItem = useCallback(async (itemData: MenuItem | Omit<MenuItem, 'id'>) => {
    const isEditMode = 'id' in itemData;
    try {
      if (isEditMode) {
<<<<<<< HEAD
        await updateMenuItem((itemData as MenuItem).id, itemData);
      } else {
        await addMenuItem(itemData as Omit<MenuItem, 'id'>);
      }
=======
        await menuItemsApi.update(itemData as MenuItem);
      } else {
        await menuItemsApi.create(itemData as Omit<MenuItem, 'id'>);
      }
      await forceCacheRefresh();
>>>>>>> d3399ff (Chefcito Beta!)
      toast.success(t('toast.success'), { description: t(isEditMode ? 'restaurant.toast.item_updated' : 'restaurant.toast.item_added'), duration: 3000 });
    } catch(error: any) {
      toast.error(t('toast.error'), { description: error.message || t(isEditMode ? 'restaurant.toast.update_item_error' : 'restaurant.toast.add_item_error'), duration: 3000 });
    }
<<<<<<< HEAD
  }, [t, updateMenuItem, addMenuItem]);

  const handleDeleteItem = useCallback(async (itemId: string) => {
     try {
      await deleteMenuItem(itemId);
=======
  }, [forceCacheRefresh, t]);

  const handleDeleteItem = useCallback(async (itemId: string) => {
     try {
      await menuItemsApi.delete(itemId);
      await forceCacheRefresh();
>>>>>>> d3399ff (Chefcito Beta!)
      toast.success(t('toast.success'), { description: t('restaurant.toast.item_deleted'), duration: 3000 });
    } catch (error: any) {
       toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.delete_item_error'), duration: 3000 });
    }
<<<<<<< HEAD
  }, [deleteMenuItem, t]);
  
  const handleDeleteMultipleItems = useCallback(async (itemIds: string[]) => {
     try {
      // Replace with API call
      const response = await fetch('/api/menu-items', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: itemIds }),
      });
      
      if (!response.ok) throw new Error('Failed to delete menu items');
      
      await forceCacheRefresh();
      const count = itemIds.length;
      toast.success(t('toast.success'), { description: t('restaurant.toast.items_deleted', { count }), duration: 3000 });
=======
  }, [forceCacheRefresh, t]);
  
  const handleDeleteMultipleItems = useCallback(async (itemIds: string[]) => {
     try {
      await Promise.all(itemIds.map(id => menuItemsApi.delete(id)));
      await forceCacheRefresh();
      toast.success(t('toast.success'), { description: t('restaurant.toast.items_deleted', { count: itemIds.length }), duration: 3000 });
>>>>>>> d3399ff (Chefcito Beta!)
    } catch (error: any) {
       toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.delete_item_error'), duration: 3000 });
    }
  }, [forceCacheRefresh, t]);

  const handleReorderItems = useCallback(async (reorderedItems: MenuItem[]) => {
<<<<<<< HEAD
    const orderedIds = reorderedItems.map(item => item.id);
    try {
      // Replace with API call
      const response = await fetch('/api/menu-items/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderedIds }),
      });
      
      if (!response.ok) throw new Error('Failed to reorder menu items');
      
      await forceCacheRefresh();
    } catch(error: any) {
       await forceCacheRefresh(); // Re-fetch to revert optimistic update
       toast.error(t('toast.error'), { description: t('restaurant.toast.reorder_error'), duration: 3000 });
=======
    try {
      // Update each item with its new sort index
      await Promise.all(reorderedItems.map((item, index) => 
        menuItemsApi.update({ ...item, sortIndex: index })
      ));
      await forceCacheRefresh();
    } catch(error: any) {
      await forceCacheRefresh(); // Re-fetch to revert optimistic update
      toast.error(t('toast.error'), { description: t('restaurant.toast.reorder_error'), duration: 3000 });
>>>>>>> d3399ff (Chefcito Beta!)
    }
  }, [forceCacheRefresh, t]);

  const handleCategoriesUpdate = useCallback(async () => {
    await forceCacheRefresh();
  }, [forceCacheRefresh])

  const handlePaymentMethodToggle = useCallback(async (id: string, enabled: boolean) => {
    try {
      const method = paymentMethods.find(m => m.id === id);
      if(method) {
<<<<<<< HEAD
        // Replace with API call
        const response = await fetch(`/api/payment-methods/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ enabled }),
        });
        
        if (!response.ok) throw new Error('Failed to update payment method');
        
=======
        await paymentMethodsApi.update({ ...method, enabled });
>>>>>>> d3399ff (Chefcito Beta!)
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
<<<<<<< HEAD
        let response;
        if (isEditMode) {
          // Replace with API call
          response = await fetch(`/api/payment-methods/${(methodData as PaymentMethod).id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(methodData),
          });
        } else {
          // Replace with API call
          response = await fetch('/api/payment-methods', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(methodData),
          });
        }
        
        if (!response.ok) throw new Error('Failed to save payment method');
        
        await forceCacheRefresh();
        toast.success(t('toast.success'), { description: t(isEditMode ? 'restaurant.toast.payment_method_updated' : 'restaurant.toast.payment_method_added'), duration: 3000 });
     } catch (error: any) {
        toast.error(t('toast.error'), { description: error.message || t(isEditMode ? 'restaurant.toast.payment_method_update_error' : 'restaurant.toast.payment_method_add_error'), duration: 3000 });
=======
       if (isEditMode) {
         await paymentMethodsApi.update(methodData as PaymentMethod);
       } else {
         await paymentMethodsApi.create(methodData as Omit<PaymentMethod, 'id'>);
       }
       await forceCacheRefresh();
       toast.success(t('toast.success'), { description: t(isEditMode ? 'restaurant.toast.payment_method_updated' : 'restaurant.toast.payment_method_added'), duration: 3000 });
     } catch(error: any) {
       toast.error(t('toast.error'), { description: error.message || t(isEditMode ? 'restaurant.toast.payment_method_update_error' : 'restaurant.toast.payment_method_add_error'), duration: 3000 });
>>>>>>> d3399ff (Chefcito Beta!)
     }
  }, [forceCacheRefresh, t]);

  const handleDeletePaymentMethod = useCallback(async (id: string) => {
<<<<<<< HEAD
    try {
      // Replace with API call
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete payment method');
      
      await forceCacheRefresh();
      toast.success(t('toast.success'), { description: t('restaurant.toast.payment_method_deleted'), duration: 3000 });
    } catch(error: any) {
      toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.payment_method_delete_error'), duration: 3000 });
    }
  }, [forceCacheRefresh, t]);

  const handleSaveInventoryItem = useCallback(async (itemData: InventoryItem | Omit<InventoryItem, 'id' | 'lastRestocked'>) => {
    const isEditMode = 'id' in itemData;
    try {
      let response;
      if (isEditMode) {
        // Replace with API call
        response = await fetch(`/api/inventory/${(itemData as InventoryItem).id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(itemData),
        });
      } else {
        // Replace with API call
        response = await fetch('/api/inventory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(itemData),
        });
      }
      
      if (!response.ok) throw new Error('Failed to save inventory item');
      
      await forceCacheRefresh();
      toast.success(t('toast.success'), { description: t(isEditMode ? 'restaurant.toast.inventory_item_updated' : 'restaurant.toast.inventory_item_added'), duration: 3000 });
    } catch (error: any) {
      toast.error(t('toast.error'), { description: error.message || t(isEditMode ? 'restaurant.toast.inventory_item_update_error' : 'restaurant.toast.inventory_item_add_error'), duration: 3000 });
    }
=======
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
>>>>>>> d3399ff (Chefcito Beta!)
  }, [forceCacheRefresh, t]);
  
  const handleAdjustInventoryStock = useCallback(async (itemId: string, adjustment: number) => {
    try {
<<<<<<< HEAD
      // Replace with API call
      const response = await fetch(`/api/inventory/${itemId}/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adjustment }),
      });
      
      if (!response.ok) throw new Error('Failed to adjust inventory stock');
      
      await forceCacheRefresh();
    } catch (error: any) {
      toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.inventory_stock_update_error'), duration: 3000 });
      await forceCacheRefresh();
    }
  }, [forceCacheRefresh, t])

  const handleDeleteInventoryItem = useCallback(async (itemId: string) => {
     try {
      // Replace with API call
      const response = await fetch(`/api/inventory/${itemId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete inventory item');
      
=======
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
>>>>>>> d3399ff (Chefcito Beta!)
      await forceCacheRefresh();
      toast.success(t('toast.success'), { description: t('restaurant.toast.inventory_item_deleted'), duration: 3000 });
    } catch (error: any) {
       toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.inventory_item_delete_error'), duration: 3000 });
    }
  }, [forceCacheRefresh, t]);

<<<<<<< HEAD
=======
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

>>>>>>> d3399ff (Chefcito Beta!)
  return {
    menuItems,
    categories,
    paymentMethods,
    customers,
    inventoryItems,
    loading,
<<<<<<< HEAD
=======
    forceCacheRefresh,
>>>>>>> d3399ff (Chefcito Beta!)
    handleSaveItem,
    handleDeleteItem,
    handleDeleteMultipleItems,
    handleReorderItems,
    handleCategoriesUpdate,
<<<<<<< HEAD
    handleSavePaymentMethod,
    handleDeletePaymentMethod,
    handlePaymentMethodToggle,
    handleSaveInventoryItem,
    handleAdjustInventoryStock,
    handleDeleteInventoryItem,
  };
};
=======
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
>>>>>>> d3399ff (Chefcito Beta!)
