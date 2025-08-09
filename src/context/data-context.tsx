
"use client";

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/context/i18n-context';
import { 
  getMenuItems, 
  getCategories, 
  getPaymentMethods,
  getCustomers,
  getInventoryItems,
} from '@/lib/mock-data';
import { type Category, type MenuItem, type PaymentMethod, type Customer, type InventoryItem } from "@/lib/types";

interface DataContextType {
  menuItems: MenuItem[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  customers: Customer[];
  inventoryItems: InventoryItem[];
  loading: boolean;
  forceCacheRefresh: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
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

  const forceCacheRefresh = useCallback(async () => {
    await fetchAllData();
  }, [fetchAllData]);

  return (
    <DataContext.Provider value={{
      menuItems,
      categories,
      paymentMethods,
      customers,
      inventoryItems,
      loading,
      forceCacheRefresh
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
