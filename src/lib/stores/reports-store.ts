import { create } from 'zustand';
import { DateRange } from 'react-day-picker';

interface SalesReportData {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  dailySales: { date: string; total: number }[];
}

interface ItemsReportData {
  bestSelling: { name: string; quantity: number; revenue: number }[];
  leastSelling: { name: string; quantity: number; revenue: number }[];
}

interface KitchenReportData {
  avgPrepTime: number;
  mostDelayed: { name: string; avgTime: number }[];
}

interface ReportsState {
  sales: SalesReportData | null;
  items: ItemsReportData | null;
  kitchen: KitchenReportData | null;
  loading: boolean;
  error: string | null;
  
  fetchReports: (dateRange?: DateRange) => Promise<void>;
  clearReports: () => void;
}

export const useReportsStore = create<ReportsState>()((set) => ({
  sales: null,
  items: null,
  kitchen: null,
  loading: false,
  error: null,
  
  fetchReports: async (dateRange?: DateRange) => {
    set({ loading: true, error: null });
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (dateRange?.from) {
        params.append('from', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.append('to', dateRange.to.toISOString());
      }
      
      const response = await fetch(`/api/reports?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        set({
          sales: result.data.sales,
          items: result.data.items,
          kitchen: result.data.kitchen,
          loading: false
        });
      } else {
        set({
          error: result.error || 'Failed to fetch reports',
          loading: false
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        loading: false
      });
    }
  },
  
  clearReports: () => {
    set({
      sales: null,
      items: null,
      kitchen: null,
      loading: false,
      error: null
    });
  }
}));