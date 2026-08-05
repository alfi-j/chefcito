"use client";

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
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
import type { PaymentReportRow, ReportsData } from '@/lib/stores/reports-store'
import type { ExportDataset } from '@/lib/export/exporter'

interface ZReportProps {
  data: ReportsData | null
  loading: boolean
}

export function ZReport({ data, loading }: ZReportProps) {
  const { t } = useTranslation()

  if (loading) {
    return <div className="flex justify-center items-center h-full min-h-[400px]"><p>{t('reports.loading')}</p></div>
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] text-muted-foreground">
        <p>{t('reports.no_data')}</p>
      </div>
    )
  }

  const { summary, payments } = data
  const totalRevenue = summary.totalRevenue
  const taxRate = 0.15
  const taxAmount = parseFloat((totalRevenue * taxRate).toFixed(2))
  const netTotal = parseFloat((totalRevenue - taxAmount).toFixed(2))

  const dataset: ExportDataset = {
    fileName: `z-report-${new Date().toISOString().slice(0, 10)}`,
    sheetName: 'Z Report',
    title: 'Z Report',
    columns: [
      { key: 'concept', label: t('reports.z.table.concept') },
      { key: 'value', label: t('reports.z.table.value') },
    ],
    rows: [
      { concept: t('reports.z.summary.total_revenue'), value: totalRevenue.toFixed(2) },
      { concept: t('reports.z.summary.total_orders'), value: summary.totalOrders },
      { concept: t('reports.z.summary.avg_order_value'), value: summary.avgOrderValue.toFixed(2) },
      ...payments.map((p) => ({ concept: p.method, value: p.revenue.toFixed(2) })),
      { concept: `${t('reports.z.taxes')} (15%)`, value: taxAmount.toFixed(2) },
      { concept: t('reports.z.net_total'), value: netTotal.toFixed(2) },
    ],
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-headline font-bold">{t('reports.tabs.z')}</h2>
        <ExportButton dataset={dataset} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">{t('reports.z.summary.total_revenue')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">${totalRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">{t('reports.z.summary.total_orders')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{summary.totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">{t('reports.z.summary.avg_order_value')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">${summary.avgOrderValue.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">{t('reports.sales.daily_sales')}</CardTitle>
            <CardDescription>{t('reports.sales.daily_sales_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.dailySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value) => [`$${(value as number).toFixed(2)}`, t('reports.sales.revenue')]} />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">{t('reports.z.payment_breakdown')}</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length > 0 ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('reports.payments.table.method')}</TableHead>
                      <TableHead className="text-right">{t('reports.payments.table.revenue')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((row: PaymentReportRow, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{row.method}</TableCell>
                        <TableCell className="text-right font-semibold">${row.revenue.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell className="font-semibold">{t('reports.z.totals')}</TableCell>
                      <TableCell className="text-right font-bold">${totalRevenue.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">{t('reports.no_data')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">{t('reports.z.tax_summary')}</CardTitle>
          <CardDescription>{t('reports.z.tax_summary_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg max-w-md">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>{t('reports.z.taxable')}</TableCell>
                  <TableCell className="text-right font-semibold">${totalRevenue.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{t('reports.z.taxes')} (15%)</TableCell>
                  <TableCell className="text-right font-semibold">${taxAmount.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">{t('reports.z.net_total')}</TableCell>
                  <TableCell className="text-right font-bold">${netTotal.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}