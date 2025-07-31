
"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSalesReport } from '@/lib/mock-data';
import { type DateRange } from 'react-day-picker';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useI18n } from '@/context/i18n-context';

interface SalesReportProps {
  dateRange?: DateRange;
}

interface ReportData {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  dailySales: { date: string; total: number }[];
}

export function SalesReport({ dateRange }: SalesReportProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    setLoading(true);
    const data = getSalesReport(dateRange);
    setReportData(data);
    setLoading(false);
  }, [dateRange]);

  if (loading) {
    return <div>{t('reports.loading')}</div>;
  }

  if (!reportData || reportData.totalOrders === 0) {
     return (
        <div className="flex items-center justify-center h-full text-muted-foreground py-10">
          <p>{t('reports.no_data')}</p>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.sales.total_revenue')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">${reportData.totalRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.sales.total_orders')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{reportData.totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.sales.avg_order_value')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">${reportData.avgOrderValue.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">{t('reports.sales.daily_sales')}</CardTitle>
          <CardDescription>{t('reports.sales.daily_sales_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.dailySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  formatter={(value) => [`$${(value as number).toFixed(2)}`, t('reports.sales.revenue')]}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
