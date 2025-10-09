
"use client"

import { useCallback } from 'react';
import { toast } from "sonner";
import { useI18n } from '@/context/i18n-context';
import { useData } from '@/context/data-context';
import { type MenuItem, type PaymentMethod, type InventoryItem, type Category } from "@/lib/types"

export const useMenu = () => {
  const { t } = useI18n();
  const {
    menuItems,
    categories,
    paymentMethods,
    customers,
    inventoryItems,
    forceCacheRefresh
  } = useData();

  // Menu Item Operations
  const addMenuItem = useCallback(async (item: Omit<MenuItem, 'id'>) => {
    try {
      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'addMenuItem', data: item }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add menu item');
      }
      
      const newItem = await response.json();
      await forceCacheRefresh();
      toast.success(t('toast.success'), { description: t('restaurant.toast.item_added'), duration: 3000 });
      return newItem;
    } catch (error: any) {
      toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.add_error'), duration: 3000 });
      throw error;
    }
  }, [t, forceCacheRefresh]);

  const updateMenuItem = useCallback(async (id: string, item: Partial<MenuItem>) => {
    try {
      const response = await fetch('/api/menu', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'updateMenuItem', id, data: item }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update menu item');
      }
      
      const updatedItem = await response.json();
      await forceCacheRefresh();
      toast.success(t('toast.success'), { description: t('restaurant.toast.item_updated'), duration: 3000 });
      return updatedItem;
    } catch (error: any) {
      toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.update_error'), duration: 3000 });
      throw error;
    }
  }, [t, forceCacheRefresh]);

  const deleteMenuItem = useCallback(async (id: string) => {
    try {
      const response = await fetch('/api/menu', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'deleteMenuItem', id }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete menu item');
      }
      
      await forceCacheRefresh();
      toast.success(t('toast.success'), { description: t('restaurant.toast.item_deleted'), duration: 3000 });
    } catch (error: any) {
      toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.delete_error'), duration: 3000 });
      throw error;
    }
  }, [t, forceCacheRefresh]);

  const deleteMenuItems = useCallback(async (ids: string[]) => {
    try {
      const response = await fetch('/api/menu', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'deleteMenuItems', ids }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete menu items');
      }
      
      await forceCacheRefresh();
      toast.success(t('toast.success'), { description: t('restaurant.toast.items_deleted'), duration: 3000 });
    } catch (error: any) {
      toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.delete_error'), duration: 3000 });
      throw error;
    }
  }, [t, forceCacheRefresh]);

  const updateMenuItemOrder = useCallback(async (categoryId: number, itemIds: string[]) => {
    try {
      const response = await fetch('/api/menu', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'updateMenuItemOrder', categoryId, itemIds }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update menu item order');
      }
      
      await forceCacheRefresh();
      toast.success(t('toast.success'), { description: t('restaurant.toast.order_updated'), duration: 3000 });
    } catch (error: any) {
      toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.update_error'), duration: 3000 });
      throw error;
    }
  }, [t, forceCacheRefresh]);

  // Category Operations
  const addCategory = useCallback(async (category: Omit<Category, 'id'>) => {
    try {
      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'addCategory', data: category }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add category');
      }
      
      const newCategory = await response.json();
      await forceCacheRefresh();
      toast.success(t('toast.success'), { description: t('restaurant.toast.category_added'), duration: 3000 });
      return newCategory;
    } catch (error: any) {
      toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.add_error'), duration: 3000 });
      throw error;
    }
  }, [t, forceCacheRefresh]);

  const updateCategory = useCallback(async (id: number, category: Partial<Category>) => {
    try {
      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'updateCategory', id, data: category }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update category');
      }
      
      const updatedCategory = await response.json();
      await forceCacheRefresh();
      toast.success(t('toast.success'), { description: t('restaurant.toast.category_updated'), duration: 3000 });
      return updatedCategory;
    } catch (error: any) {
      toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.update_error'), duration: 3000 });
      throw error;
    }
  }, [t, forceCacheRefresh]);

  const deleteCategory = useCallback(async (id: number) => {
    try {
      const response = await fetch('/api/menu', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'deleteCategory', id }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete category');
      }
      
      await forceCacheRefresh();
      toast.success(t('toast.success'), { description: t('restaurant.toast.category_deleted'), duration: 3000 });
    } catch (error: any) {
      toast.error(t('toast.error'), { 
        description: error.message === 'Category is in use' 
          ? t('restaurant.toast.category_in_use') 
          : (error.message || t('restaurant.toast.delete_error')), 
        duration: 3000 
      });
      throw error;
    }
  }, [t, forceCacheRefresh]);

  const isCategoryInUse = useCallback(async (id: number) => {
    // This would typically be an API call, but for now we'll implement it client-side
    return menuItems.some(item => item.category === categories.find(c => c.id === id)?.name);
  }, [menuItems, categories]);

  // Payment Method Operations
  const addPaymentMethod = useCallback(async (method: Omit<PaymentMethod, 'id'>) => {
    try {
      const response = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(method),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add payment method');
      }
      
      const newMethod = await response.json();
      await forceCacheRefresh();
      toast.success(t('toast.success'), { description: t('restaurant.toast.payment_method_added'), duration: 3000 });
      return newMethod;
    } catch (error: any) {
      toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.add_error'), duration: 3000 });
      throw error;
    }
  }, [t, forceCacheRefresh]);

  const updatePaymentMethod = useCallback(async (id: string, method: Partial<PaymentMethod>) => {
    try {
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(method),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update payment method');
      }
      
      const updatedMethod = await response.json();
      await forceCacheRefresh();
      toast.success(t('toast.success'), { description: t('restaurant.toast.payment_method_updated'), duration: 3000 });
      return updatedMethod;
    } catch (error: any) {
      toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.update_error'), duration: 3000 });
      throw error;
    }
  }, [t, forceCacheRefresh]);

  const deletePaymentMethod = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete payment method');
      }
      
      await forceCacheRefresh();
      toast.success(t('toast.success'), { description: t('restaurant.toast.payment_method_deleted'), duration: 3000 });
    } catch (error: any) {
      toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.delete_error'), duration: 3000 });
      throw error;
    }
  }, [t, forceCacheRefresh]);

  // Inventory Operations
  const addInventoryItem = useCallback(async (item: Omit<InventoryItem, 'id'>) => {
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add inventory item');
      }
      
      const newItem = await response.json();
      await forceCacheRefresh();
      toast.success(t('toast.success'), { description: t('restaurant.toast.inventory_item_added'), duration: 3000 });
      return newItem;
    } catch (error: any) {
      toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.add_error'), duration: 3000 });
      throw error;
    }
  }, [t, forceCacheRefresh]);

  const updateInventoryItem = useCallback(async (id: string, item: Partial<InventoryItem>) => {
    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: item }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update inventory item');
      }
      
      const updatedItem = await response.json();
      await forceCacheRefresh();
      toast.success(t('toast.success'), { description: t('restaurant.toast.inventory_item_updated'), duration: 3000 });
      return updatedItem;
    } catch (error: any) {
      toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.update_error'), duration: 3000 });
      throw error;
    }
  }, [t, forceCacheRefresh]);

  const adjustInventoryStock = useCallback(async (id: string, amount: number) => {
    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'adjustStock', amount }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to adjust inventory stock');
      }
      
      const updatedItem = await response.json();
      await forceCacheRefresh();
      toast.success(t('toast.success'), { description: t('restaurant.toast.stock_adjusted'), duration: 3000 });
      return updatedItem;
    } catch (error: any) {
      toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.adjust_error'), duration: 3000 });
      throw error;
    }
  }, [t, forceCacheRefresh]);

  const deleteInventoryItem = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete inventory item');
      }
      
      await forceCacheRefresh();
      toast.success(t('toast.success'), { description: t('restaurant.toast.inventory_item_deleted'), duration: 3000 });
    } catch (error: any) {
      toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.delete_error'), duration: 3000 });
      throw error;
    }
  }, [t, forceCacheRefresh]);

  return {
    // Menu Items
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    deleteMenuItems,
    updateMenuItemOrder,
    
    // Categories
    addCategory,
    updateCategory,
    deleteCategory,
    isCategoryInUse,
    
    // Payment Methods
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    
    // Inventory
    addInventoryItem,
    updateInventoryItem,
    adjustInventoryStock,
    deleteInventoryItem,
    
    // Data
    menuItems,
    categories,
    paymentMethods,
    customers,
    inventoryItems,
    forceCacheRefresh,
    
    // Missing properties that are expected by components
    loading: false,
    fetchAllData: () => Promise.resolve(),
    handleSavePaymentMethod: () => Promise.resolve(),
    handleDeletePaymentMethod: () => Promise.resolve(),
    handlePaymentMethodToggle: () => Promise.resolve(),
    handleReorderItems: () => Promise.resolve()
  };
};
