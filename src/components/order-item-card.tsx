"use client"

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Clock, CookingPot, Utensils } from 'lucide-react'
import { type OrderItem } from '@/lib/types'
import { useI18nStore } from '@/lib/stores/i18n-store'
import { KDS_STATES } from '@/lib/constants'

interface OrderItemCardProps {
  item: OrderItem
  onStatusChange?: (itemId: string, status: 'cooked' | 'ready' | 'served') => void
  canUpdateStatus?: boolean
  showStatusButtons?: boolean
}

export function OrderItemCard({ 
  item, 
  onStatusChange,
  canUpdateStatus = false,
  showStatusButtons = false
}: OrderItemCardProps) {
  const { t } = useI18nStore()
  
  // Determine the primary status based on the current status
  const getPrimaryStatus = () => {
    return item.status;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case KDS_STATES.NEW: return <Clock className="h-4 w-4" />
      case KDS_STATES.IN_PROGRESS: return <CookingPot className="h-4 w-4" />
      case KDS_STATES.READY: return <Check className="h-4 w-4" />
      case 'served': return <Utensils className="h-4 w-4" />
      default: return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case KDS_STATES.NEW: return t('orders.status.new')
      case KDS_STATES.IN_PROGRESS: return t('orders.status.in_progress')
      case KDS_STATES.READY: return t('orders.status.ready')
      case 'served': return t('orders.status.served')
      default: return status
    }
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            {/* Number and icon in a column, item name centered vertically */}
            <div className="flex items-center gap-2 mb-1">
              <div className="text-center" style={{ minWidth: '2rem' }}>
                <div className="font-semibold">{item.quantity}x</div>
                <div className="mt-1 flex justify-center">
                  {getStatusIcon(item.status)}
                </div>
              </div>
              <span className="font-medium truncate">{item.menuItem.name}</span>
            </div>
            
            {item.selectedExtras && item.selectedExtras.length > 0 && (
              <div className="text-sm text-muted-foreground ml-2">
                {item.selectedExtras.map(extra => (
                  <div key={extra.id}>+ {extra.name}</div>
                ))}
              </div>
            )}
            
            {item.notes && (
              <div className="text-sm text-primary italic mt-1 ml-2">
                {t('orders.table.notes')}: {item.notes}
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-1 ml-2">
            {/* Removed the original status display here */}
            
            {showStatusButtons && canUpdateStatus && (
              <div className="flex gap-1 mt-1">
                {item.status === KDS_STATES.NEW && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-6 px-2 text-xs"
                    onClick={() => onStatusChange?.(item.id, 'cooked')}
                  >
                    {t('orders.actions.cook')}
                  </Button>
                )}
                
                {item.status === KDS_STATES.IN_PROGRESS && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-6 px-2 text-xs"
                    onClick={() => onStatusChange?.(item.id, 'ready')}
                  >
                    {t('orders.actions.ready')}
                  </Button>
                )}
                
                {item.status === KDS_STATES.READY && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-6 px-2 text-xs"
                    onClick={() => onStatusChange?.(item.id, 'served')}
                  >
                    {t('orders.actions.serve')}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}