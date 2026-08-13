"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, Crown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useUserStore } from '@/lib/stores/user-store'
import { useProAccess } from '@/lib/hooks/use-pro-access'
import { SubscriptionCard } from '@/components/subscription/subscription-card'
import { PayphonePaymentBox } from '@/components/subscription/payphone-payment-box'

interface ProFeatureGateProps {
  children: React.ReactNode
}

/**
 * Wraps a Pro-only page/section. While the restaurant has an active Pro
 * subscription the children are rendered normally; otherwise an inline paywall
 * is shown — the upsell card plus the PayPhone payment box for owners, or a
 * locked message for non-owners.
 */
export function ProFeatureGate({ children }: ProFeatureGateProps) {
  const { t } = useTranslation()
  const user = useUserStore((s) => s.getCurrentUser())
  const { isPro, loading } = useProAccess()
  const [isSubscribing, setIsSubscribing] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <p className="text-muted-foreground">{t('subscription.gate.loading')}</p>
      </div>
    )
  }

  if (isPro) {
    return <>{children}</>
  }

  const isOwner = user?.role === 'Owner'

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-headline font-bold">{t('subscription.gate.locked_title')}</h2>
        <p className="max-w-md text-muted-foreground">{t('subscription.gate.locked_desc')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SubscriptionCard
        subscription={null}
        currentMembership="free"
        onSubscribe={() => setIsSubscribing(true)}
        onCancel={() => {}}
        isLoading={false}
        isOwner={true}
      />

      {isSubscribing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              {t('subscription.gate.pay_title')}
            </CardTitle>
            <CardDescription>{t('subscription.gate.pay_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <PayphonePaymentBox
              ownerEmail={user?.email ?? ''}
              restaurantName={user?.name ?? ''}
              restaurantId={user?.restaurantId ?? ''}
            />
            <Button variant="outline" className="mt-4 w-full" onClick={() => setIsSubscribing(false)}>
              {t('subscription.gate.pay_cancel')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}