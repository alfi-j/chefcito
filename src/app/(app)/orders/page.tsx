
"use client"

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useOrders } from '@/hooks/use-orders'
import { useI18n } from '@/context/i18n-context'
import { groupReadyItemsByTable } from '@/lib/utils'
import { type ReadyItem } from '@/lib/types'
import { Separator } from '@/components/ui/separator'
import { StickyNote } from 'lucide-react'
import { MdOutlineTableRestaurant } from 'react-icons/md'

export default function ReadyToServePage() {
  const { orders, loading, updateItemStatus } = useOrders();
  const { t } = useI18n();

  const readyItemsByTable = useMemo(() => {
    return groupReadyItemsByTable(orders);
  }, [orders]);

  const sortedTables = useMemo(() => {
    return Object.keys(readyItemsByTable).sort((a, b) => Number(a) - Number(b));
  }, [readyItemsByTable]);
  
  const handleMarkAsServed = (item: ReadyItem) => {
    // We can reuse the existing updateItemStatus function.
    // Advancing from 'Ready' will mark it as served and remove it from this view.
    updateItemStatus(item.orderId, item.orderItemId);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>{t('kds.loading')}</p>
      </div>
    );
  }

  if (sortedTables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
        <Card className="p-10">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">{t('orders.no_ready_items_title')}</CardTitle>
            </CardHeader>
            <CardContent>
                <p>{t('orders.no_ready_items_desc')}</p>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {sortedTables.map(table => (
          <Card key={table} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                <MdOutlineTableRestaurant className="h-6 w-6" />
                <span>{t('pos.current_order.table')} {table}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              {readyItemsByTable[table].map((item) => (
                <div key={item.id} className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex justify-between items-start gap-2">
                        <div>
                            <p className="font-semibold">{item.name}</p>
                            {item.selectedExtras && item.selectedExtras.length > 0 && (
                                <div className="pl-2 text-xs text-muted-foreground font-medium">
                                    {item.selectedExtras.map(extra => (
                                    <div key={extra.id}>+ {extra.name}</div>
                                    ))}
                                </div>
                            )}
                            {item.notes && (
                                <div className="mt-1.5 flex items-start gap-1.5 text-xs text-primary/80">
                                    <StickyNote className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"/>
                                    <p className="italic whitespace-pre-wrap">{item.notes}</p>
                                </div>
                            )}
                        </div>
                        <Button size="sm" onClick={() => handleMarkAsServed(item)}>
                            {t('orders.mark_as_served')}
                        </Button>
                    </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
