
"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { type Order, type OrderItem } from "@/lib/types"
import { useI18n } from "@/context/i18n-context"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { getOrderTotal } from "../page"
import { ClipboardList, User, Utensils, Clock, CheckCircle, Hourglass, Receipt } from "lucide-react"
import { MdOutlineTableRestaurant } from "react-icons/md"

interface OrderDetailsDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
  onViewReceipt: (order: Order) => void
}

const getItemTotal = (item: OrderItem) => {
    const extrasPrice = item.selectedExtras?.reduce((acc, extra) => acc + extra.price, 0) || 0;
    const totalUnits = (item.cookedCount || 0) + (item.quantity || 0);
    return (item.menuItem.price + extrasPrice) * totalUnits;
}

export function OrderDetailsDialog({ isOpen, onOpenChange, order, onViewReceipt }: OrderDetailsDialogProps) {
  const { t } = useI18n()

  if (!order) return null

  const orderTotal = getOrderTotal(order);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Hourglass className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <ClipboardList className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  const handleReceiptClick = () => {
    onViewReceipt(order);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{t('orders.details.title')} #{order.id}</DialogTitle>
          <DialogDescription>{t('orders.details.description')}</DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
                <MdOutlineTableRestaurant className="h-4 w-4" />
                <span>{t('pos.current_order.table')} {order.table}</span>
            </div>
             <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{order.staffName || 'N/A'}</span>
            </div>
             <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{format(new Date(order.createdAt), 'PPp')}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
                <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="capitalize">
                    {t(`orders.status.${order.status}`)}
                </Badge>
            </div>
        </div>

        <Separator />

        <div className="space-y-4">
            <div>
                <h3 className="font-semibold mb-2">{t('orders.details.items')}</h3>
                <ScrollArea className="h-48 border rounded-md p-2">
                    <div className="space-y-3">
                    {order.items.map(item => (
                        <div key={item.id}>
                            <div className="flex justify-between items-start">
                                <div className="flex gap-2">
                                    <span className="font-semibold">{(item.quantity + item.cookedCount)}x</span>
                                    <div className="flex-1">
                                        <p className="font-medium">{item.menuItem.name}</p>
                                        {item.selectedExtras && item.selectedExtras.length > 0 && (
                                            <div className="pl-2 text-xs text-muted-foreground">
                                                {item.selectedExtras.map(extra => (
                                                <div key={extra.id}>+ {extra.name} (${extra.price.toFixed(2)})</div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className="font-medium text-right">${getItemTotal(item).toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                    </div>
                </ScrollArea>
            </div>
             <div>
                <h3 className="font-semibold mb-2">{t('orders.details.status_history')}</h3>
                <div className="space-y-3">
                    {order.statusHistory?.map((history, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <div>{getStatusIcon(history.status)}</div>
                            <div className="flex-1">
                                <p className="font-medium capitalize">{t(`orders.status.${history.status}`)}</p>
                                <p className="text-xs text-muted-foreground">{format(new Date(history.timestamp), 'PPp')}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <Separator />

        <div className="flex justify-end items-center text-lg font-bold">
            <span>{t('pos.current_order.total')}:</span>
            <span className="ml-2 text-primary">${orderTotal.toFixed(2)}</span>
        </div>

        <DialogFooter>
          {order.status === 'completed' && (
            <Button variant="secondary" onClick={handleReceiptClick}>
              <Receipt className="mr-2 h-4 w-4" />
              {t('orders.details.view_receipt')}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('dialog.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
