
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
import { getKitchenPerformanceReport } from '@/lib/mock-data';
import { useI18n } from '@/context/i18n-context';
import { Badge } from '@/components/ui/badge';

interface KitchenReportProps {
  dateRange?: DateRange;
}

interface PerformanceData {
  avgPrepTime: number;
  mostDelayed: { name: string; avgTime: number }[];
}

export function KitchenReport({ dateRange }: KitchenReportProps) {
  const [reportData, setReportData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      const data = await getKitchenPerformanceReport(dateRange);
      setReportData(data);
      setLoading(false);
    }
    fetchReport();
  }, [dateRange]);

  if (loading) {
    return <div>{t('reports.loading')}</div>;
  }

  if (!reportData || (reportData.avgPrepTime === 0 && reportData.mostDelayed.length === 0)) {
    return (
        <div className="flex items-center justify-center h-full text-muted-foreground py-10">
          <p>{t('reports.no_data')}</p>
        </div>
    )
  }

  const formatTime = (minutes: number) => {
    if (minutes < 1) return `${Math.round(minutes * 60)}s`;
    return `${Math.round(minutes)}m`;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">{t('reports.kitchen.avg_prep_time')}</CardTitle>
          <CardDescription>{t('reports.kitchen.avg_prep_time_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">{formatTime(reportData.avgPrepTime)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">{t('reports.kitchen.most_delayed')}</CardTitle>
          <CardDescription>{t('reports.kitchen.most_delayed_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {reportData.mostDelayed.length > 0 ? (
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('reports.kitchen.table.item')}</TableHead>
                            <TableHead className="text-right">{t('reports.kitchen.table.avg_time')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reportData.mostDelayed.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant="destructive">{formatTime(item.avgTime)}</Badge>
                                </TableCell>
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
    </div>
  );
}
