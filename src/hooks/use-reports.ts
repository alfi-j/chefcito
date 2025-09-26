"use client"

import { useState, useCallback } from 'react';
import { type DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import { useI18n } from '@/context/i18n-context';
import { ordersApi } from '@/lib/api-client';
import { Order, OrderItem } from '@/lib/types';

interface ReportData {
  sales: any | null;
  items: {
    bestSelling: any[];
    leastSelling: any[];
  } | null;
  kitchen: {
    avgPrepTime: number;
    mostDelayed: { name: string; avgTime: number }[];
  } | null;
}

export const useReports = (dateRange?: DateRange) => {
  const [reports, setReports] = useState<ReportData>({
    sales: null,
    items: null,
    kitchen: null,
  });
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  const fetchAllReports = useCallback(async () => {
    setLoading(true);
    try {
        // In a real implementation, you would have specific API endpoints for reports
        // For now, we'll fetch all orders and let the report components handle the data processing
        const allOrders: Order[] = await ordersApi.getAll();
        
        // Process sales data
        let totalRevenue = 0;
        let totalOrders = allOrders.length;
        
        allOrders.forEach(order => {
          order.items.forEach(item => {
            totalRevenue += item.menuItem.price * item.quantity;
            if (item.selectedExtras) {
              item.selectedExtras.forEach(extra => {
                totalRevenue += extra.price * item.quantity;
              });
            }
          });
        });
        
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        // Process items data
        // Create a map to count quantities and calculate totals for each item
        const itemMap = new Map<string, { name: string; quantity: number; total: number }>();
        
        allOrders.forEach(order => {
          order.items.forEach(item => {
            const itemId = item.menuItem.id;
            const itemPrice = item.menuItem.price;
            const itemQuantity = item.quantity;
            const itemTotal = itemPrice * itemQuantity;
            
            if (itemMap.has(itemId)) {
              const existingItem = itemMap.get(itemId)!;
              existingItem.quantity += itemQuantity;
              existingItem.total += itemTotal;
            } else {
              itemMap.set(itemId, {
                name: item.menuItem.name,
                quantity: itemQuantity,
                total: itemTotal
              });
            }
          });
        });
        
        // Convert map to array and sort by quantity
        const itemsArray = Array.from(itemMap.values());
        itemsArray.sort((a, b) => b.quantity - a.quantity);
        
        // Get best selling (top 5) and least selling (bottom 5) items
        const bestSelling = itemsArray.slice(0, 5);
        const leastSelling = itemsArray.slice(-5).reverse();
        
        // Process kitchen data
        // Mock kitchen data - in a real app, this would be calculated from actual prep times
        const kitchenData = {
          avgPrepTime: 12.5, // Average preparation time in minutes
          mostDelayed: [
            { name: "Burger", avgTime: 18.2 },
            { name: "Pasta", avgTime: 15.7 },
            { name: "Salad", avgTime: 8.3 }
          ]
        };
        
        const salesData = {
          totalRevenue,
          totalOrders,
          avgOrderValue,
          dailySales: []
        };
        
        const itemsData = {
          bestSelling,
          leastSelling
        };
        
        setReports({
            sales: salesData,
            items: itemsData,
            kitchen: kitchenData
        });
    } catch (error) {
       console.error("Failed to fetch report data:", error);
       toast.error(t('toast.error'), { description: t('reports.toast.fetch_error'), duration: 3000 });
    } finally {
        setLoading(false);
    }
  }, [dateRange, t]);
  
  return {
    reports,
    loading,
    fetchAllReports
  };
};