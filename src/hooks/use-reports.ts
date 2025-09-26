<<<<<<< HEAD

"use client"

import { useState, useCallback, useEffect } from 'react';
import { type DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import { useI18n } from '@/context/i18n-context';
import { 
  getCategories, 
  getMenuItems
} from '@/lib/mock-data';

interface UseReportsReturn {
  sales: null;
  items: null;
  kitchen: null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useReports(dateRange: DateRange): UseReportsReturn {
  const [data, setData] = useState<{
    sales: null;
    items: null;
    kitchen: null;
  }>({ sales: null, items: null, kitchen: null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Mock data since we don't have the actual functions
      setData({
        sales: null,
        items: null,
        kitchen: null
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const refetch = useCallback(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    ...data,
    isLoading,
    error,
    refetch
  };
}
=======
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
>>>>>>> d3399ff (Chefcito Beta!)
