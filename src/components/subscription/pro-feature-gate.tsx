"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Lock } from 'lucide-react'
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
 * subscription the children are rendered normally; otherwise an upsell card is
 * shown — the subscribe button opens the PayPhone payment box in a modal for
 * owners, or a locked message is shown for non-owners.
 */
export function ProFeatureGate({ children }: ProFeatureGateProps) {
  const { t } = useTranslation()
  const user = useUserStore((s) => s.getCurrentUser())
  const { isPro, loading } = useProAccess()
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)

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
        onSubscribe={() => setIsPaymentDialogOpen(true)}
        onCancel={() => {}}
        isLoading={false}
        isOwner={true}
      />

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-auto w-[95vw] sm:w-auto">
          <DialogHeader className="p-3 sm:p-4 pb-0">
            <DialogTitle className="font-headline text-2xl">
              {t('subscription.gate.pay_title')}
            </DialogTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('subscription.gate.pay_desc')}
            </p>
          </DialogHeader>

          <div className="p-4 sm:p-6 space-y-4">
            <PayphonePaymentBox
              ownerEmail={user?.email ?? ''}
              restaurantName={user?.name ?? ''}
              restaurantId={user?.restaurantId ?? ''}
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsPaymentDialogOpen(false)}
            >
              {t('subscription.gate.pay_cancel')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
