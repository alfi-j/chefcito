"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useI18nStore } from '@/lib/stores/i18n-store'
import { Crown, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'

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

interface SubscriptionCardProps {
  subscription: Subscription | null
  currentMembership: 'free' | 'pro'
  onSubscribe: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function SubscriptionCard({ 
  subscription, 
  currentMembership, 
  onSubscribe, 
  onCancel,
  isLoading = false 
}: SubscriptionCardProps) {
  const { t } = useI18nStore()

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: {
        variant: 'default' as const,
        icon: CheckCircle2,
        label: t('profile.subscription.status_active'),
        className: 'bg-green-500'
      },
      cancelled: {
        variant: 'secondary' as const,
        icon: XCircle,
        label: t('profile.subscription.status_cancelled'),
        className: 'bg-gray-500'
      },
      expired: {
        variant: 'outline' as const,
        icon: AlertCircle,
        label: t('profile.subscription.status_expired'),
        className: 'border-orange-500 text-orange-500'
      },
      pending: {
        variant: 'outline' as const,
        icon: Clock,
        label: t('profile.subscription.status_pending'),
        className: 'border-blue-500 text-blue-500'
      }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const isPro = currentMembership === 'pro'
  const hasActiveSubscription = subscription?.status === 'active'

  return (
    <Card className={isPro ? "border-yellow-500 bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-950/20 dark:to-transparent" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className={`w-6 h-6 ${isPro ? 'text-yellow-500' : 'text-gray-400'}`} />
            <CardTitle>{t('profile.subscription.title')}</CardTitle>
          </div>
          {subscription && getStatusBadge(subscription.status)}
        </div>
        <CardDescription>{t('profile.subscription.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Plan Actual */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">{t('profile.subscription.current_plan')}</p>
            <p className={`text-lg font-semibold ${isPro ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>
              {isPro ? t('profile.subscription.plan_pro') : t('profile.subscription.plan_free')}
            </p>
          </div>
          {isPro && (
            <Badge variant="secondary" className="bg-yellow-500 text-white">
              PRO
            </Badge>
          )}
        </div>

        {/* Detalles de la suscripción */}
        {subscription && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('profile.subscription.start_date')}:</span>
              <span className="font-medium">{formatDate(subscription.startDate)}</span>
            </div>
            {subscription.endDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('profile.subscription.end_date')}:</span>
                <span className="font-medium">{formatDate(subscription.endDate)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('profile.subscription.amount')}:</span>
              <span className="font-medium">${(subscription.amount / 100).toFixed(2)} {subscription.currency}</span>
            </div>
          </div>
        )}

        {/* Características Pro */}
        {isPro && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-yellow-700 dark:text-yellow-400">
              {t('profile.subscription.pro_features.title')}
            </h4>
            <ul className="space-y-1">
              {[
                t('profile.subscription.pro_features.feature_1'),
                t('profile.subscription.pro_features.feature_2'),
                t('profile.subscription.pro_features.feature_3'),
                t('profile.subscription.pro_features.feature_4'),
                t('profile.subscription.pro_features.feature_5'),
                t('profile.subscription.pro_features.feature_6')
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Botones de acción */}
        <div className="pt-4 border-t">
          {!hasActiveSubscription && !isPro ? (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                <p className="font-semibold">{t('profile.subscription.price')}</p>
                <p>{t('profile.subscription.subscribe_desc')}</p>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white"
                onClick={onSubscribe}
                disabled={isLoading}
              >
                {isLoading ? t('profile.subscription.processing') : t('profile.subscription.subscribe_button')}
              </Button>
            </div>
          ) : hasActiveSubscription ? (
            <Button 
              variant="outline" 
              className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
              onClick={onCancel}
              disabled={isLoading}
            >
              {isLoading ? t('profile.subscription.cancelling') : t('profile.subscription.cancel_subscription')}
            </Button>
          ) : (
            <div className="text-center text-sm text-muted-foreground py-2">
              {t('profile.subscription.no_subscription')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
