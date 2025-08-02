
"use client"

import { useState, useEffect, useCallback } from 'react';
import { toast } from "sonner";
import { useI18n } from '@/context/i18n-context';
import { 
  getMenuItems, 
  getCategories, 
  addMenuItem, 
  updateMenuItem, 
  deleteMenuItem,
  deleteMenuItems,
  getPaymentMethods,
  updatePaymentMethod as mockUpdatePaymentMethod,
  addPaymentMethod as mockAddPaymentMethod,
  deletePaymentMethod as mockDeletePaymentMethod,
  getCustomers,
  getInventoryItems,
  addInventoryItem as mockAddInventoryItem,
  updateInventoryItem as mockUpdateInventoryItem,
  adjustInventoryStock,
} from '@/lib/mock-data';
import { type Category, type MenuItem, type PaymentMethod, type Customer, type InventoryItem } from "@/lib/types"

export const useMenu = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
        const [menuData, categoryData, paymentData, customerData, inventoryData] = await Promise.all([
            getMenuItems(),
            getCategories(),
            getPaymentMethods(),
            getCustomers(),
            getInventoryItems(),
        ]);
        setMenuItems(menuData);
        setCategories(categoryData);
        setPaymentMethods(paymentData);
        setCustomers(customerData);
        setInventoryItems(inventoryData);
    } catch (error) {
       console.error("Failed to fetch data:", error);
       toast.error(t('toast.error'), { description: t('restaurant.toast.fetch_error'), duration: 3000 });
    } finally {
        setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);
  
  const handleSaveItem = async (itemData: MenuItem | Omit<MenuItem, 'id'>) => {
    const isEditMode = 'id' in itemData;
    try {
      if (isEditMode) {
        await updateMenuItem(itemData as MenuItem);
      } else {
        await addMenuItem(itemData as Omit<MenuItem, 'id'>);
      }
      await fetchAllData();
      toast.success(t('toast.success'), { description: t(isEditMode ? 'restaurant.toast.item_updated' : 'restaurant.toast.item_added'), duration: 3000 });
    } catch(error: any) {
      toast.error(t('toast.error'), { description: error.message || t(isEditMode ? 'restaurant.toast.update_item_error' : 'restaurant.toast.add_item_error'), duration: 3000 });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
     try {
      await deleteMenuItem(itemId);
      await fetchAllData();
      toast.success(t('toast.success'), { description: t('restaurant.toast.item_deleted'), duration: 3000 });
    } catch (error: any) {
       toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.delete_item_error'), duration: 3000 });
    }
  };
  
  const handleDeleteMultipleItems = async (itemIds: string[]) => {
     try {
      const count = itemIds.length;
      await deleteMenuItems(itemIds);
      await fetchAllData();
      toast.success(t('toast.success'), { description: t('restaurant.toast.items_deleted', { count }), duration: 3000 });
    } catch (error: any) {
       toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.delete_item_error'), duration: 3000 });
    }
  }

  const handleCategoriesUpdate = () => {
    fetchAllData();
  }

  const handlePaymentMethodToggle = async (id: string, enabled: boolean) => {
    try {
      const method = paymentMethods.find(m => m.id === id);
      if(method) {
        await mockUpdatePaymentMethod({ ...method, enabled });
        await fetchAllData();
        toast.success(t('toast.success'), { description: t('restaurant.toast.payment_method_updated'), duration: 3000 });
      }
    } catch(error: any) {
      toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.payment_method_update_error'), duration: 3000 });
    }
  }

  const handleSavePaymentMethod = async (methodData: PaymentMethod | Omit<PaymentMethod, 'id'>) => {
     const isEditMode = 'id' in methodData;
     try {
        if (isEditMode) {
          await mockUpdatePaymentMethod(methodData as PaymentMethod);
        } else {
          await mockAddPaymentMethod(methodData as Omit<PaymentMethod, 'id'>);
        }
        await fetchAllData();
        toast.success(t('toast.success'), { description: t(isEditMode ? 'restaurant.toast.payment_method_updated' : 'restaurant.toast.payment_method_added'), duration: 3000 });
     } catch (error: any) {
        toast.error(t('toast.error'), { description: error.message || t(isEditMode ? 'restaurant.toast.payment_method_update_error' : 'restaurant.toast.payment_method_add_error'), duration: 3000 });
     }
  }

  const handleDeletePaymentMethod = async (id: string) => {
    try {
      await mockDeletePaymentMethod(id);
      await fetchAllData();
      toast.success(t('toast.success'), { description: t('restaurant.toast.payment_method_deleted'), duration: 3000 });
    } catch(error: any) {
      toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.payment_method_delete_error'), duration: 3000 });
    }
  }

  const handleSaveInventoryItem = async (itemData: InventoryItem | Omit<InventoryItem, 'id' | 'lastRestocked'>) => {
    const isEditMode = 'id' in itemData;
    try {
      if (isEditMode) {
        await mockUpdateInventoryItem(itemData as InventoryItem);
      } else {
        await mockAddInventoryItem(itemData as Omit<InventoryItem, 'id' | 'lastRestocked'>);
      }
      await fetchAllData();
      toast.success(t('toast.success'), { description: t(isEditMode ? 'restaurant.toast.inventory_item_updated' : 'restaurant.toast.inventory_item_added'), duration: 3000 });
    } catch (error: any) {
      toast.error(t('toast.error'), { description: error.message || t(isEditMode ? 'restaurant.toast.inventory_item_update_error' : 'restaurant.toast.inventory_item_add_error'), duration: 3000 });
    }
  };
  
  const handleAdjustInventoryStock = async (itemId: string, adjustment: number) => {
    try {
      await adjustInventoryStock(itemId, adjustment);
      // Optimistic update for responsiveness
      setInventoryItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId
            ? { ...item, quantity: Math.max(0, item.quantity + adjustment) }
            : item
        )
      );
      // No toast for quick adjustments to avoid spamming user
    } catch (error: any) {
      toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.inventory_stock_update_error'), duration: 3000 });
      await fetchAllData(); // Re-fetch to correct state on error
    }
  }

  return {
    menuItems,
    categories,
    paymentMethods,
    customers,
    inventoryItems,
    loading,
    setMenuItems, // for optimistic updates like drag-n-drop
    fetchAllData,
    handleSaveItem,
    handleDeleteItem,
    handleDeleteMultipleItems,
    handleCategoriesUpdate,
    handleSavePaymentMethod,
    handleDeletePaymentMethod,
    handlePaymentMethodToggle,
    handleSaveInventoryItem,
    handleAdjustInventoryStock,
  };
};
