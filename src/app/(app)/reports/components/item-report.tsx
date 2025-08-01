
"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type DateRange } from 'react-day-picker';
import { getItemSalesReport } from '@/lib/mock-data';
import { useI18n } from '@/context/i18n-context';

interface ItemReportProps {
  dateRange?: DateRange;
}

interface ItemSale {
  name: string;
  quantity: number;
  total: number;
}

export function ItemReport({ dateRange }: ItemReportProps) {
  const [reportData, setReportData] = useState<{ bestSelling: ItemSale[], leastSelling: ItemSale[] }>({ bestSelling: [], leastSelling: [] });
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      const data = await getItemSalesReport(dateRange);
      setReportData(data);
      setLoading(false);
    }
    fetchReport();
  }, [dateRange]);

  const renderTable = (items: ItemSale[], title: string) => (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reports.items.table.item')}</TableHead>
                  <TableHead className="text-right">{t('reports.items.table.quantity_sold')}</TableHead>
                  <TableHead className="text-right">{t('reports.items.table.total_revenue')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right font-semibold">${item.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-muted-foreground">{t('reports.no_data')}</p>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return <div>{t('reports.loading')}</div>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {renderTable(reportData.bestSelling, t('reports.items.best_selling'))}
      {renderTable(reportData.leastSelling, t('reports.items.least_selling'))}
    </div>
  );
}
