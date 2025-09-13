"use client";

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/context/i18n-context';
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
        // Fetch all data from API routes
        const [menuRes, categoriesRes, paymentsRes, customersRes, inventoryRes] = await Promise.all([
            fetch('/api/menu-items'),
            fetch('/api/categories'),
            fetch('/api/payment-methods'),
            fetch('/api/customers'),
            fetch('/api/inventory'),
        ]);

        if (!menuRes.ok || !categoriesRes.ok || !paymentsRes.ok || !customersRes.ok || !inventoryRes.ok) {
            throw new Error('Failed to fetch data from API');
        }

        const [menuData, categoriesData, paymentsData, customersData, inventoryData] = await Promise.all([
            menuRes.json(),
            categoriesRes.json(),
            paymentsRes.json(),
            customersRes.json(),
            inventoryRes.json(),
        ]);

        // Ensure price is parsed as a number for menu items
        const parsedMenuItems = menuData.map((item: any) => ({
          ...item,
          price: typeof item.price === 'string' ? parseFloat(item.price) : item.price
        }));

        setMenuItems(parsedMenuItems);
        setCategories(categoriesData);
        setPaymentMethods(paymentsData);
        setCustomers(customersData);
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