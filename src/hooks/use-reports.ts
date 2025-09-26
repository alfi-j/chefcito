"use client"

import { useState, useCallback } from 'react';
import { type DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import { useI18n } from '@/context/i18n-context';
import { ordersApi } from '@/lib/api-client';

interface ReportData {
  sales: any | null;
  items: any | null;
  kitchen: any | null;
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
        const allOrders = await ordersApi.getAll();
        
        // Mock processed data - in a real app, this would come from dedicated API endpoints
        const salesData = {
          totalRevenue: 0,
          orderCount: allOrders.length,
          averageOrderValue: 0,
          dailyData: []
        };
        
        const itemsData: any[] = [];
        const kitchenData: any[] = [];
        
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