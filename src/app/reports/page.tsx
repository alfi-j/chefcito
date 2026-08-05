"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronDown, FileBarChart } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { TransactionsReport } from "@/components/reports/transactions-report";
import { SellersReport } from "@/components/reports/sellers-report";
import { ItemReport } from "@/components/reports/item-report";
import { PaymentsReport } from "@/components/reports/payments-report";
import { ZReport } from "@/components/reports/z-report";
import { KitchenReport } from "@/components/reports/kitchen-report";
import { TaxDeclarationPanel } from "@/components/reports/tax-declaration-panel";
import { useTranslation } from 'react-i18next';
import { useReportsStore } from '@/lib/stores/reports-store';
import { useUserStore } from '@/lib/stores/user-store';
import { type DateRange } from 'react-day-picker';
import { addDays } from 'date-fns';
import { Landmark } from 'lucide-react';

const REPORT_TABS = [
  { value: 'transactions', labelKey: 'reports.tabs.transactions' },
  { value: 'sellers', labelKey: 'reports.tabs.sellers' },
  { value: 'items', labelKey: 'reports.tabs.items' },
  { value: 'payments', labelKey: 'reports.tabs.payments' },
  { value: 'z', labelKey: 'reports.tabs.z' },
  { value: 'kitchen', labelKey: 'reports.tabs.kitchen' },
] as const;

export default function ReportsPage() {
  const { t } = useTranslation();

  const currentUser = useUserStore((state) => state.getCurrentUser());
  const restaurantId = currentUser?.restaurantId;

  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });
  const [isTaxOpen, setIsTaxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<(typeof REPORT_TABS)[number]['value']>('transactions');

  const { data, loading, fetchReports } = useReportsStore();

  const loadReports = useCallback(() => {
    if (!restaurantId) return;
    fetchReports(restaurantId, date);
  }, [restaurantId, date, fetchReports]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto flex items-center gap-2">
                <FileBarChart className="h-4 w-4" />
                {t(REPORT_TABS.find((tab) => tab.value === activeTab)?.labelKey ?? REPORT_TABS[0].labelKey)}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-full sm:w-56">
              {REPORT_TABS.map((tab) => (
                <DropdownMenuItem key={tab.value} onSelect={() => setActiveTab(tab.value)}>
                  {t(tab.labelKey)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full sm:w-auto">
          <DateRangePicker date={date} onDateChange={setDate} className="w-full sm:w-auto" />
          <Button variant="outline" onClick={() => setIsTaxOpen(true)} className="w-full sm:w-auto">
            <Landmark className="mr-2 h-4 w-4" />
            {t('reports.tax.button')}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {activeTab === 'transactions' && (
          <TransactionsReport data={data?.transactions ?? null} loading={loading} />
        )}
        {activeTab === 'sellers' && (
          <SellersReport data={data?.sellers ?? null} loading={loading} />
        )}
        {activeTab === 'items' && (
          <ItemReport data={data?.items ?? null} loading={loading} />
        )}
        {activeTab === 'payments' && (
          <PaymentsReport data={data?.payments ?? null} loading={loading} />
        )}
        {activeTab === 'z' && (
          <ZReport data={data} loading={loading} />
        )}
        {activeTab === 'kitchen' && (
          <KitchenReport data={data?.kitchen ?? null} loading={loading} />
        )}
      </div>

      <TaxDeclarationPanel
        open={isTaxOpen}
        onOpenChange={setIsTaxOpen}
        transactions={data?.transactions ?? []}
        periodFrom={date?.from?.toISOString()}
        periodTo={date?.to?.toISOString()}
      />
    </div>
  );
}