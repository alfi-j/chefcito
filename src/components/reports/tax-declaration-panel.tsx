"use client";

import React, { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { generateTaxDeclaration } from '@/lib/tax/engine'
import { supportedCountries, getCountrySpec } from '@/lib/tax/registry'
import type { TaxCountry, TaxDeclarationConfig, TaxMode } from '@/lib/tax/types'
import type { TaxTransaction } from '@/lib/tax/types'
import { format } from 'date-fns'

interface TaxDeclarationPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactions: TaxTransaction[]
  periodFrom?: string
  periodTo?: string
}

interface DeclarationForm {
  country: TaxCountry
  ruc: string
  businessName: string
  tradeName: string
  address: string
  email: string
  phone: string
  activity: string
  regime: string
  establishmentCode: string
  emissionPointCode: string
  sequenceStart: string
  vatRate: string
  taxMode: TaxMode
  fixedTaxAmount: string
}

const STORAGE_KEY = 'chefcito-tax-declaration-config'

const emptyForm = (country: TaxCountry = 'ec'): DeclarationForm => ({
  country,
  ruc: '',
  businessName: '',
  tradeName: '',
  address: '',
  email: '',
  phone: '',
  activity: 'Restaurante',
  regime: 'Regimen General',
  establishmentCode: '001',
  emissionPointCode: '001',
  sequenceStart: '1',
  vatRate: String(getCountrySpec(country).defaultVatRate ?? 15),
  taxMode: 'percentage',
  fixedTaxAmount: '',
})

export function TaxDeclarationPanel({
  open,
  onOpenChange,
  transactions,
  periodFrom,
  periodTo,
}: TaxDeclarationPanelProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState<DeclarationForm>(emptyForm())
  const [isGenerating, setIsGenerating] = useState(false)

  const [prevOpen, setPrevOpen] = useState(open)

  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          setForm({ ...emptyForm(), ...JSON.parse(stored) })
        }
      } catch {
        // ignore corrupt storage
      }
    }
  }

  const setField = (key: keyof DeclarationForm) => (value: string) => {
    if (key === 'country') {
      const country = value as TaxCountry
      setForm((prev) => ({
        ...prev,
        country,
        vatRate: String(getCountrySpec(country).defaultVatRate ?? 15),
      }))
      return
    }
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const currencySymbol = getCountrySpec(form.country).currencySymbol ?? '$'

  const summary = useMemo(() => {
    const total = transactions.reduce((sum, tx) => sum + tx.total, 0)
    const fixedTaxAmount = parseFloat(form.fixedTaxAmount) || 0
    const tax =
      form.taxMode === 'fixed'
        ? fixedTaxAmount
        : (total * (parseFloat(form.vatRate) || 0)) / 100
    return { total, tax, net: total - tax }
  }, [transactions, form.vatRate, form.taxMode, form.fixedTaxAmount])

  const handleGenerate = () => {
    if (!form.ruc.trim() || !form.businessName.trim()) {
      toast.error(t('reports.tax.errors.missing_taxpayer'))
      return
    }
    if (transactions.length === 0) {
      toast.error(t('reports.tax.errors.no_transactions'))
      return
    }
    if (form.taxMode === 'fixed' && (!form.fixedTaxAmount || parseFloat(form.fixedTaxAmount) <= 0)) {
      toast.error(t('reports.tax.errors.fixed_tax_amount'))
      return
    }

    setIsGenerating(true)
    try {
      const config: TaxDeclarationConfig = {
        country: form.country,
        taxpayer: {
          ruc: form.ruc.trim(),
          businessName: form.businessName.trim(),
          tradeName: form.tradeName.trim() || undefined,
          address: form.address.trim() || undefined,
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          activity: form.activity.trim() || undefined,
          regime: form.regime.trim() || undefined,
        },
        period: {
          from: periodFrom ?? format(new Date(), 'yyyy-MM-dd'),
          to: periodTo ?? format(new Date(), 'yyyy-MM-dd'),
          fiscalYear: new Date(periodTo ?? new Date()).getFullYear(),
        },
        emission: {
          establishmentCode: form.establishmentCode.trim() || '001',
          emissionPointCode: form.emissionPointCode.trim() || '001',
          sequenceStart: parseInt(form.sequenceStart, 10) || 1,
        },
        vatRate: (parseFloat(form.vatRate) || 0) / 100,
        taxMode: form.taxMode,
        fixedTaxAmount: form.taxMode === 'fixed' ? parseFloat(form.fixedTaxAmount) : undefined,
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(form))

      const output = generateTaxDeclaration(form.country, config, { transactions })
      const blob = new Blob([output.content], { type: output.mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = output.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(t('reports.tax.success'))
    } catch (error) {
      console.error('Error generating tax declaration:', error)
      toast.error(t('reports.tax.errors.generation'))
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">
            {t('reports.tax.title')}
          </DialogTitle>
          <DialogDescription>{t('reports.tax.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-2">{t('reports.tax.country_section')}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tax-country">{t('reports.tax.country')}</Label>
                <Select value={form.country} onValueChange={setField('country')}>
                  <SelectTrigger id="tax-country" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedCountries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax-regime">{t('reports.tax.regime')}</Label>
                <Input id="tax-regime" value={form.regime} onChange={(e) => setField('regime')(e.target.value)} />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold mb-2">{t('reports.tax.taxpayer_section')}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tax-ruc">{t('reports.tax.ruc')}</Label>
                <Input id="tax-ruc" value={form.ruc} onChange={(e) => setField('ruc')(e.target.value)} placeholder="0000000000001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax-business-name">{t('reports.tax.business_name')}</Label>
                <Input id="tax-business-name" value={form.businessName} onChange={(e) => setField('businessName')(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax-trade-name">{t('reports.tax.trade_name')}</Label>
                <Input id="tax-trade-name" value={form.tradeName} onChange={(e) => setField('tradeName')(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax-activity">{t('reports.tax.activity')}</Label>
                <Input id="tax-activity" value={form.activity} onChange={(e) => setField('activity')(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax-address">{t('reports.tax.address')}</Label>
                <Input id="tax-address" value={form.address} onChange={(e) => setField('address')(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tax-phone">{t('reports.tax.phone')}</Label>
                  <Input id="tax-phone" value={form.phone} onChange={(e) => setField('phone')(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax-email">{t('reports.tax.email')}</Label>
                  <Input id="tax-email" type="email" value={form.email} onChange={(e) => setField('email')(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold mb-2">{t('reports.tax.emission_section')}</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="tax-establishment">{t('reports.tax.establishment_code')}</Label>
                <Input id="tax-establishment" value={form.establishmentCode} onChange={(e) => setField('establishmentCode')(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax-point">{t('reports.tax.emission_point_code')}</Label>
                <Input id="tax-point" value={form.emissionPointCode} onChange={(e) => setField('emissionPointCode')(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax-sequence">{t('reports.tax.sequence_start')}</Label>
                <Input id="tax-sequence" type="number" value={form.sequenceStart} onChange={(e) => setField('sequenceStart')(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 mt-4">
              <div className="space-y-2">
                <Label htmlFor="tax-vat">{t('reports.tax.vat_rate')}</Label>
                <Input id="tax-vat" type="number" value={form.vatRate} onChange={(e) => setField('vatRate')(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t('reports.tax.period')}</Label>
                <Input value={`${periodFrom ?? '—'} / ${periodTo ?? '—'}`} disabled />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">{t('reports.tax.fixed_tax_label')}</p>
                <p className="text-xs text-muted-foreground">{t('reports.tax.fixed_tax_hint')}</p>
              </div>
              <Switch
                checked={form.taxMode === 'fixed'}
                onCheckedChange={(checked) =>
                  setField('taxMode')(checked ? 'fixed' : 'percentage')
                }
              />
            </div>
            {form.taxMode === 'fixed' && (
              <div className="mt-2 space-y-2">
                <Label htmlFor="tax-fixed-amount">{t('reports.tax.fixed_tax_amount')}</Label>
                <Input
                  id="tax-fixed-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={`${currencySymbol} 0.00`}
                  value={form.fixedTaxAmount}
                  onChange={(e) => setField('fixedTaxAmount')(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="rounded-lg border p-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">{t('reports.tax.summary.total')}</p>
              <p className="text-lg font-bold">{currencySymbol}{summary.total.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('reports.tax.summary.tax')}</p>
              <p className="text-lg font-bold">{currencySymbol}{summary.tax.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('reports.tax.summary.net')}</p>
              <p className="text-lg font-bold">{currencySymbol}{summary.net.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {t('reports.tax.footer', { count: transactions.length })}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('reports.tax.cancel')}
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? t('reports.tax.generating') : t('reports.tax.generate')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}