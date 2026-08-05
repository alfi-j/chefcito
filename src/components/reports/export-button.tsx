"use client";

import React from 'react'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, FileDown } from "lucide-react"
import { useTranslation } from 'react-i18next'
import { exportDataset, type ExportDataset, type ExportFormat } from '@/lib/export/exporter'

interface ExportButtonProps {
  dataset: ExportDataset
  disabled?: boolean
  className?: string
}

export function ExportButton({ dataset, disabled, className }: ExportButtonProps) {
  const { t } = useTranslation()

  const handleExport = (format: ExportFormat) => {
    exportDataset(dataset, format)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled} className={className}>
          <FileDown className="mr-2 h-4 w-4" />
          {t('reports.export.button')}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t('reports.export.label')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => handleExport('csv')}>
          {t('reports.export.csv')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleExport('xlsx')}>
          {t('reports.export.xlsx')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleExport('pdf')}>
          {t('reports.export.pdf')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}