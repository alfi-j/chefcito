"use client";

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { changeLanguage, type SupportedLanguage } from '@/lib/i18n'
import { supportedCountries } from '@/lib/tax/registry'
import { useUserStore } from '@/lib/stores/user-store'
import { toast } from 'sonner'

interface GeneralSettingsProps {
  restaurantId: string
}

export function GeneralSettings({ restaurantId }: GeneralSettingsProps) {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const currentUser = useUserStore().getCurrentUser()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState<string>(supportedCountries[0]?.code ?? '')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isOwner = currentUser?.role === 'Owner'
  const ownerId = currentUser?.id

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

  const handleDeleteRestaurant = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId }),
      })

      if (response.ok) {
        toast.success(t('restaurant.general.delete_success'))
        // Clear the current session and redirect to login
        useUserStore.getState().logout()
        router.push('/login')
      } else {
        toast.error(t('restaurant.general.delete_error'))
        setIsDeleting(false)
      }
    } catch (error) {
      console.error('Error deleting restaurant:', error)
      toast.error(t('restaurant.general.delete_error'))
      setIsDeleting(false)
    }
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
                <SelectItem value="fr">{t('restaurant.general.language_french')}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t('restaurant.general.language_desc')}</p>
          </div>
        </CardContent>
      </Card>

      {isOwner && (
        <>
          <Separator />

          {/* Danger Zone */}
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-destructive">{t('restaurant.general.danger_zone')}</CardTitle>
              <CardDescription>{t('restaurant.general.danger_zone_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={isDeleting}
                  >
                    {isDeleting ? t('restaurant.general.deleting') : t('restaurant.general.delete_restaurant')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('restaurant.general.delete_confirm_title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('restaurant.general.delete_confirm_desc')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('dialog.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteRestaurant}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {t('restaurant.general.delete_restaurant')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}