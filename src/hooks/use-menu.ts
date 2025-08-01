
"use client"

import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
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
} from '@/lib/mock-data';
import { type Category, type MenuItem, type PaymentMethod } from "@/lib/types"

export const useMenu = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useI18n();

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
        const [menuData, categoryData, paymentData] = await Promise.all([
            getMenuItems(),
            getCategories(),
            getPaymentMethods()
        ]);
        setMenuItems(menuData);
        setCategories(categoryData);
        setPaymentMethods(paymentData);
    } catch (error) {
       console.error("Failed to fetch data:", error);
       toast({ title: t('toast.error'), description: t('restaurant.toast.fetch_error'), variant: "destructive" });
    } finally {
        setLoading(false);
    }
  }, [toast, t]);

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
      toast({ title: t('toast.success'), description: t(isEditMode ? 'restaurant.toast.item_updated' : 'restaurant.toast.item_added') });
    } catch(error: any) {
      toast({ title: t('toast.error'), description: error.message || t(isEditMode ? 'restaurant.toast.update_item_error' : 'restaurant.toast.add_item_error'), variant: "destructive" });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
     try {
      await deleteMenuItem(itemId);
      await fetchAllData();
      toast({ title: t('toast.success'), description: t('restaurant.toast.item_deleted') });
    } catch (error: any) {
       toast({ title: t('toast.error'), description: error.message || t('restaurant.toast.delete_item_error'), variant: "destructive" });
    }
  };
  
  const handleDeleteMultipleItems = async (itemIds: string[]) => {
     try {
      const count = itemIds.length;
      await deleteMenuItems(itemIds);
      await fetchAllData();
      toast({ title: t('toast.success'), description: t('restaurant.toast.items_deleted', { count }) });
    } catch (error: any) {
       toast({ title: t('toast.error'), description: error.message || t('restaurant.toast.delete_item_error'), variant: "destructive" });
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
        toast({ title: t('toast.success'), description: t('restaurant.toast.payment_method_updated') });
      }
    } catch(error: any) {
      toast({ title: t('toast.error'), description: error.message || t('restaurant.toast.payment_method_update_error'), variant: "destructive" });
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
        toast({ title: t('toast.success'), description: t(isEditMode ? 'restaurant.toast.payment_method_updated' : 'restaurant.toast.payment_method_added') });
     } catch (error: any) {
        toast({ title: t('toast.error'), description: error.message || t(isEditMode ? 'restaurant.toast.payment_method_update_error' : 'restaurant.toast.payment_method_add_error'), variant: "destructive" });
     }
  }

  const handleDeletePaymentMethod = async (id: string) => {
    try {
      await mockDeletePaymentMethod(id);
      await fetchAllData();
      toast({ title: t('toast.success'), description: t('restaurant.toast.payment_method_deleted') });
    } catch(error: any) {
      toast({ title: t('toast.error'), description: error.message || t('restaurant.toast.payment_method_delete_error'), variant: "destructive" });
    }
  }

  return {
    menuItems,
    categories,
    paymentMethods,
    loading,
    setMenuItems, // for optimistic updates like drag-n-drop
    fetchAllData,
    handleSaveItem,
    handleDeleteItem,
    handleDeleteMultipleItems,
    handleCategoriesUpdate,
    handleSavePaymentMethod,
    handleDeletePaymentMethod,
    handlePaymentMethodToggle
  };
};
