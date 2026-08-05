"use client";

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { ExportButton } from '@/components/reports/export-button'
import type { TransactionReportRow } from '@/lib/stores/reports-store'
import type { ExportDataset } from '@/lib/export/exporter'

interface TransactionsReportProps {
  data: TransactionReportRow[] | null
  loading: boolean
}

export function TransactionsReport({ data, loading }: TransactionsReportProps) {
  const { t } = useTranslation()

  if (loading) {
    return <div className="flex justify-center items-center h-full min-h-[400px]"><p>{t('reports.loading')}</p></div>
  }

  const transactions = data ?? []

  if (transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] text-muted-foreground">
        <p>{t('reports.no_data')}</p>
      </div>
    )
  }

  const dataset: ExportDataset = {
    fileName: `transactions-${new Date().toISOString().slice(0, 10)}`,
    sheetName: 'Transactions',
    title: t('reports.tabs.transactions'),
    columns: [
      { key: 'id', label: t('reports.transactions.table.id') },
      { key: 'date', label: t('reports.transactions.table.date') },
      { key: 'table', label: t('reports.transactions.table.table') },
      { key: 'customerName', label: t('reports.transactions.table.customer') },
      { key: 'seller', label: t('reports.transactions.table.seller') },
      { key: 'orderType', label: t('reports.transactions.table.order_type') },
      { key: 'itemsCount', label: t('reports.transactions.table.items') },
      { key: 'total', label: t('reports.transactions.table.total') },
    ],
    rows: transactions.map((row) => ({
      id: row.id,
      date: format(new Date(row.date), 'yyyy-MM-dd HH:mm'),
      table: row.table,
      customerName: row.customerName || '—',
      seller: row.seller || '—',
      orderType: row.orderType,
      itemsCount: row.itemsCount,
      total: row.total,
    })),
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="font-headline">{t('reports.tabs.transactions')}</CardTitle>
        <ExportButton dataset={dataset} />
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reports.transactions.table.id')}</TableHead>
                <TableHead>{t('reports.transactions.table.date')}</TableHead>
                <TableHead>{t('reports.transactions.table.table')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('reports.transactions.table.customer')}</TableHead>
                <TableHead className="hidden sm:table-cell">{t('reports.transactions.table.seller')}</TableHead>
                <TableHead className="hidden lg:table-cell">{t('reports.transactions.table.items')}</TableHead>
                <TableHead className="text-right">{t('reports.transactions.table.total')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">#{row.id}</TableCell>
                  <TableCell>{format(new Date(row.date), 'yyyy-MM-dd HH:mm')}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{row.table}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{row.customerName || '—'}</TableCell>
                  <TableCell className="hidden sm:table-cell">{row.seller || '—'}</TableCell>
                  <TableCell className="hidden lg:table-cell">{row.itemsCount}</TableCell>
                  <TableCell className="text-right font-semibold">${row.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}