"use client";

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useTranslation } from 'react-i18next'
import { ExportButton } from '@/components/reports/export-button'
import type { SellerReportRow } from '@/lib/stores/reports-store'
import type { ExportDataset } from '@/lib/export/exporter'

interface SellersReportProps {
  data: SellerReportRow[] | null
  loading: boolean
}

export function SellersReport({ data, loading }: SellersReportProps) {
  const { t } = useTranslation()

  if (loading) {
    return <div className="flex justify-center items-center h-full min-h-[400px]"><p>{t('reports.loading')}</p></div>
  }

  const sellers = data ?? []

  if (sellers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] text-muted-foreground">
        <p>{t('reports.no_data')}</p>
      </div>
    )
  }

  const dataset: ExportDataset = {
    fileName: `sellers-${new Date().toISOString().slice(0, 10)}`,
    sheetName: 'Sellers',
    title: t('reports.tabs.sellers'),
    columns: [
      { key: 'seller', label: t('reports.sellers.table.seller') },
      { key: 'orders', label: t('reports.sellers.table.orders') },
      { key: 'revenue', label: t('reports.sellers.table.revenue') },
      { key: 'avgOrderValue', label: t('reports.sellers.table.avg') },
    ],
    rows: sellers.map((row) => ({
      seller: row.seller,
      orders: row.orders,
      revenue: row.revenue,
      avgOrderValue: row.avgOrderValue,
    })),
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="font-headline">{t('reports.tabs.sellers')}</CardTitle>
        <ExportButton dataset={dataset} />
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reports.sellers.table.seller')}</TableHead>
                <TableHead className="text-right">{t('reports.sellers.table.orders')}</TableHead>
                <TableHead className="text-right">{t('reports.sellers.table.revenue')}</TableHead>
                <TableHead className="text-right">{t('reports.sellers.table.avg')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sellers.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{row.seller}</TableCell>
                  <TableCell className="text-right">{row.orders}</TableCell>
                  <TableCell className="text-right font-semibold">${row.revenue.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${row.avgOrderValue.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}