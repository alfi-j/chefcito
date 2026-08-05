"use client";

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/helpers'
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
import type { PaymentReportRow } from '@/lib/stores/reports-store'
import type { ExportDataset } from '@/lib/export/exporter'

interface PaymentsReportProps {
  data: PaymentReportRow[] | null
  loading: boolean
}

export function PaymentsReport({ data, loading }: PaymentsReportProps) {
  const { t } = useTranslation()

  if (loading) {
    return <div className="flex justify-center items-center h-full min-h-[400px]"><p>{t('reports.loading')}</p></div>
  }

  const payments = data ?? []

  if (payments.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] text-muted-foreground">
        <p>{t('reports.no_data')}</p>
      </div>
    )
  }

  const dataset: ExportDataset = {
    fileName: `payments-${new Date().toISOString().slice(0, 10)}`,
    sheetName: 'Payments',
    title: t('reports.tabs.payments'),
    columns: [
      { key: 'method', label: t('reports.payments.table.method') },
      { key: 'orders', label: t('reports.payments.table.orders') },
      { key: 'revenue', label: t('reports.payments.table.revenue') },
      { key: 'share', label: t('reports.payments.table.share') },
    ],
    rows: payments.map((row) => ({
      method: row.method,
      orders: row.orders,
      revenue: row.revenue,
      share: `${row.share}%`,
    })),
  }

  const maxShare = Math.max(...payments.map((p) => p.share), 1)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="font-headline">{t('reports.tabs.payments')}</CardTitle>
        <ExportButton dataset={dataset} />
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reports.payments.table.method')}</TableHead>
                <TableHead className="text-right">{t('reports.payments.table.orders')}</TableHead>
                <TableHead className="text-right">{t('reports.payments.table.revenue')}</TableHead>
                <TableHead className="text-right">{t('reports.payments.table.share')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{row.method}</TableCell>
                  <TableCell className="text-right">{row.orders}</TableCell>
                  <TableCell className="text-right font-semibold">${row.revenue.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full bg-primary')}
                          style={{ width: `${(row.share / maxShare) * 100}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-sm">{row.share}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}