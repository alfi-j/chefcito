"use client";

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useTranslation } from 'react-i18next'
import { changeLanguage, type SupportedLanguage } from '@/lib/i18n'
import { supportedCountries } from '@/lib/tax/registry'
import { toast } from 'sonner'

interface GeneralSettingsProps {
  restaurantId: string
}

export function GeneralSettings({ restaurantId }: GeneralSettingsProps) {
  const { t, i18n } = useTranslation()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState<string>(supportedCountries[0]?.code ?? '')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!restaurantId) return
    let active = true

    const loadRestaurant = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/restaurants/${restaurantId}`)
        if (response.ok) {
          const data = await response.json()
          if (data && !data.error && active) {
            setName(data.name || '')
            setPhone(data.phone || '')
            setAddress(data.address || '')
            setCity(data.city || '')
            setCountry(data.country || supportedCountries[0]?.code || '')
          }
        }
      } catch (error) {
        console.error('Error loading restaurant settings:', error)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadRestaurant()

    return () => {
      active = false
    }
  }, [restaurantId])

  const handleSaveInfo = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, address, city, country }),
      })

      if (response.ok) {
        toast.success(t('restaurant.general.info_saved'))
      } else {
        toast.error(t('restaurant.general.info_error'))
      }
    } catch (error) {
      console.error('Error saving restaurant info:', error)
      toast.error(t('restaurant.general.info_error'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangeLanguage = (value: string) => {
    changeLanguage(value as SupportedLanguage)
  }

  if (isLoading) {
    return (
      <div className="p-6 text-muted-foreground">
        {t('restaurant.general.loading')}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Restaurant Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t('restaurant.general.information_title')}</CardTitle>
          <CardDescription>{t('restaurant.general.information_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="restaurant-name">{t('restaurant.general.name')}</Label>
            <Input
              id="restaurant-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="restaurant-phone">{t('restaurant.general.phone')}</Label>
            <Input
              id="restaurant-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="restaurant-address">{t('restaurant.general.address')}</Label>
              <Input
                id="restaurant-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="restaurant-city">{t('restaurant.general.city')}</Label>
              <Input
                id="restaurant-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="restaurant-country">{t('restaurant.general.country')}</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger id="restaurant-country" className="w-full sm:max-w-xs">
                <SelectValue placeholder={t('restaurant.general.country')} />
              </SelectTrigger>
              <SelectContent>
                {supportedCountries.map((supported) => (
                  <SelectItem key={supported.code} value={supported.code}>
                    {supported.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t('restaurant.general.country_desc')}</p>
          </div>
          <Button onClick={handleSaveInfo} disabled={isSaving}>
            {t('restaurant.general.save_info')}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* General Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>{t('restaurant.general.preferences_title')}</CardTitle>
          <CardDescription>{t('restaurant.general.preferences_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default-language">{t('restaurant.general.default_language')}</Label>
            <Select value={i18n.language} onValueChange={handleChangeLanguage}>
              <SelectTrigger id="default-language" className="w-full sm:max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t('restaurant.general.language_english')}</SelectItem>
                <SelectItem value="es">{t('restaurant.general.language_spanish')}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t('restaurant.general.language_desc')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}