"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useI18nStore } from '@/lib/stores/i18n-store'
import { SubscriptionCard } from '@/components/subscription/subscription-card'
import { PayphonePaymentBox } from '@/components/subscription/payphone-payment-box'
import { CancelSubscriptionDialog } from '@/components/subscription/cancel-subscription-dialog'
import { useUserStore } from '@/lib/stores/user-store'
import { toast } from 'sonner'

interface Subscription {
  _id: string
  userId: string
  plan: 'free' | 'pro'
  status: 'active' | 'cancelled' | 'expired' | 'pending'
  startDate: string
  endDate?: string
  amount: number
  currency: string
  clientTransactionId?: string
}

export default function ProfilePage() {
  const { t } = useI18nStore()
  const user = useUserStore((state) => state.getCurrentUser())
  const updateMembership = useUserStore((state) => state.updateMembership)
  
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [paymentMode, setPaymentMode] = useState(false)

  // Cargar suscripción al montar el componente
  useEffect(() => {
    if (!user?.id) return

    const loadSubscription = async () => {
      try {
        const response = await fetch(`/api/subscriptions?userId=${user.id}`)
        if (response.ok) {
          const data = await response.json()
          if (data.hasSubscription && data.subscription) {
            setSubscription(data.subscription)
          }
        }
      } catch (error) {
        console.error('Error loading subscription:', error)
      }
    }

    loadSubscription()
  }, [user?.id])

  // Manejar mensajes de resultado de pago desde la URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentStatus = urlParams.get('payment')

    if (paymentStatus) {
      if (paymentStatus === 'success') {
        toast.success(t('profile.subscription.payment_success'))
        // Recargar suscripción
        loadSubscription()
      } else if (paymentStatus === 'failed') {
        toast.error(t('profile.subscription.payment_failed'))
      } else if (paymentStatus === 'error') {
        toast.error(t('profile.subscription.payment_error'))
      }
      // Limpiar parámetro de la URL
      window.history.replaceState({}, document.title, '/profile')
    }
  }, [])

  const loadSubscription = async () => {
    if (!user?.id) return
    
    try {
      const response = await fetch(`/api/subscriptions?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.hasSubscription && data.subscription) {
          setSubscription(data.subscription)
        }
      }
    } catch (error) {
      console.error('Error loading subscription:', error)
    }
  }

  const handleSubscribe = () => {
    // Solo mostrar la cajita de pagos
    setPaymentMode(true)
  }

  const handlePaymentSuccess = async () => {
    // La confirmación se maneja en el webhook de Payphone
    // Esperamos un momento y recargamos la suscripción
    setTimeout(() => {
      loadSubscription()
      setPaymentMode(false)
    }, 2000)
  }

  const handlePaymentError = () => {
    toast.error(t('profile.subscription.payment_error'))
    setPaymentMode(false)
  }

  const handleCancelSubscription = async (reason?: string) => {
    if (!subscription?.clientTransactionId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/subscriptions/${subscription.clientTransactionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      })

      if (response.ok) {
        toast.success(t('profile.subscription.cancelled_success'))
        updateMembership(user!.id, 'free')
        setSubscription(null)
        setShowCancelDialog(false)
      } else {
        toast.error(t('profile.subscription.cancel_error'))
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      toast.error(t('profile.subscription.cancel_error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">{t('profile.title')}</h1>
        <p className="text-muted-foreground">{t('profile.description')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información Personal */}
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.personal_info')}</CardTitle>
            <CardDescription>{t('profile.personal_info_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('profile.name')}</Label>
              <Input id="name" defaultValue={user?.name || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('profile.email')}</Label>
              <Input id="email" type="email" defaultValue={user?.email || ''} />
            </div>
            <Button>{t('profile.save_button')}</Button>
          </CardContent>
        </Card>

        {/* Sección de Suscripción */}
        <SubscriptionCard
          subscription={subscription}
          currentMembership={user?.membership as 'free' | 'pro' || 'free'}
          onSubscribe={handleSubscribe}
          onCancel={() => setShowCancelDialog(true)}
          isLoading={isLoading}
        />
      </div>

      <Separator />

      {/* Diálogo de Pago con Payphone */}
      {paymentMode && user && (
        <Card>
          <CardHeader>
            <CardTitle>Completar Suscripción Pro</CardTitle>
            <CardDescription>
              Usa el botón de Payphone a continuación para completar tu suscripción de $4.99 USD
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PayphonePaymentBox
              userEmail={user.email}
              userName={user.name}
              userDocumentId={user.id}
            />
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Serás redirigido para confirmar el pago
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setPaymentMode(false)
                  loadSubscription()
                }}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>{t('profile.logout')}</CardTitle>
          <CardDescription>{t('profile.logout_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive">{t('profile.logout_button')}</Button>
        </CardContent>
      </Card>

      {/* Diálogo de Cancelación de Suscripción */}
      <CancelSubscriptionDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleCancelSubscription}
        isLoading={isLoading}
      />
    </div>
  )
}
