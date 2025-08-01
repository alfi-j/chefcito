
"use client"

import { useState, useCallback } from 'react';
import { type DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import { useI18n } from '@/context/i18n-context';
import { 
  getSalesReport, 
  getItemSalesReport, 
  getKitchenPerformanceReport,
} from '@/lib/mock-data';

interface ReportData {
  sales: Awaited<ReturnType<typeof getSalesReport>> | null;
  items: Awaited<ReturnType<typeof getItemSalesReport>> | null;
  kitchen: Awaited<ReturnType<typeof getKitchenPerformanceReport>> | null;
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
        const [salesData, itemsData, kitchenData] = await Promise.all([
            getSalesReport(dateRange),
            getItemSalesReport(dateRange),
            getKitchenPerformanceReport(dateRange)
        ]);
        setReports({
            sales: salesData,
            items: itemsData,
            kitchen: kitchenData
        });
    } catch (error) {
       console.error("Failed to fetch report data:", error);
       toast.error(t('toast.error'), { description: t('reports.toast.fetch_error') });
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
