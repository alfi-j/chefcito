import { create } from 'zustand';
import { DateRange } from 'react-day-picker';

export interface TransactionReportRow {
  id: number;
  date: string;
  table: string | number;
  customerName: string;
  seller: string;
  orderType: string;
  itemsCount: number;
  total: number;
  paymentMethod: string | null;
}

export interface SellerReportRow {
  seller: string;
  orders: number;
  revenue: number;
  avgOrderValue: number;
}

export interface ItemSaleRow {
  name: string;
  quantity: number;
  revenue: number;
}

export interface PaymentReportRow {
  method: string;
  orders: number;
  revenue: number;
  share: number;
}

export interface ReportsData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    dailySales: { date: string; total: number }[];
  };
  transactions: TransactionReportRow[];
  sellers: SellerReportRow[];
  items: { bestSelling: ItemSaleRow[]; leastSelling: ItemSaleRow[] };
  payments: PaymentReportRow[];
  kitchen: { avgPrepTime: number; mostDelayed: { name: string; avgTime: number }[] };
}

interface ReportsState {
  data: ReportsData | null;
  loading: boolean;
  error: string | null;
  fetchReports: (restaurantId: string, dateRange?: DateRange) => Promise<void>;
  clearReports: () => void;
}

export const useReportsStore = create<ReportsState>()((set) => ({
  data: null,
  loading: false,
  error: null,

  fetchReports: async (restaurantId, dateRange) => {
    set({ loading: true, error: null });

    try {
      const params = new URLSearchParams({ restaurantId });
      if (dateRange?.from) {
        params.append('from', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.append('to', dateRange.to.toISOString());
      }

      const response = await fetch(`/api/reports?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        set({ data: result.data, loading: false });
      } else {
        set({ error: result.error || 'Failed to fetch reports', loading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        loading: false
      });
    }
  },

  clearReports: () => {
    set({ data: null, loading: false, error: null });
  }
}));