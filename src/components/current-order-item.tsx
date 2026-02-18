"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Minus, Plus } from 'lucide-react'
import { type OrderItem } from '@/lib/types'
import { useCurrentOrderStoreCompat as useCurrentOrderStore } from '@/lib/stores/current-order-store'
import { useI18nStore } from '@/lib/stores/i18n-store'

interface CurrentOrderItemProps {
  item: OrderItem
}

export function CurrentOrderItem({ item }: CurrentOrderItemProps) {
  const { t } = useI18nStore()
  const { updateItemQuantity, removeItem } = useCurrentOrderStore()

  const handleIncrement = () => {
    updateItemQuantity(item.id, 1)
  }

  const handleDecrement = () => {
    updateItemQuantity(item.id, -1)
  }

  const handleRemove = () => {
    removeItem(item.id)
  }

  const extrasPrice = item.selectedExtras?.reduce((acc, extra) => acc + extra.price, 0) || 0
  const itemTotal = (item.menuItem.price + extrasPrice) * item.quantity

  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-medium truncate">{item.menuItem.name}</h4>
            {item.notes && (
              <p className="text-xs text-muted-foreground mt-1">{t('pos.order.notes')}: {item.notes}</p>
            )}
            {item.selectedExtras && item.selectedExtras.length > 0 && (
              <div className="mt-1">
                <p className="text-xs text-muted-foreground">
                  {item.selectedExtras.map(extra => extra.name).join(', ')}
                </p>
              </div>
            )}
          </div>

        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center">
            <Button variant="outline" size="icon" className="h-6 w-6" onClick={handleDecrement}>
              <Minus className="h-3 w-3" />
            </Button>
            <span className="mx-2 text-sm font-medium w-8 text-center">{item.quantity}</span>
            <Button variant="outline" size="icon" className="h-6 w-6" onClick={handleIncrement}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <span className="text-sm font-medium">${itemTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
