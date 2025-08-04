
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
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { getOrderTotal, getItemTotal } from "@/lib/utils"
import { ChefHat, Printer, Download } from "lucide-react"
import { toast } from "sonner"

interface ReceiptDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
}

export function ReceiptDialog({ isOpen, onOpenChange, order }: ReceiptDialogProps) {
  const { t } = useI18n()

  if (!order) return null

  const orderTotal = getOrderTotal(order);
  const tax = orderTotal * 0.08;
  const subtotal = orderTotal - tax;
  
  const handlePrint = () => {
    toast.info(t('orders.receipt.print_toast_title'), {
        description: t('orders.receipt.print_toast_desc'),
        duration: 3000
    })
  }
  
  const handleDownload = () => {
     toast.info(t('orders.receipt.download_toast_title'), {
        description: t('orders.receipt.download_toast_desc'),
        duration: 3000
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-0">
        <div className="p-6 bg-card text-card-foreground">
            <div className="flex flex-col items-center text-center space-y-2">
                <ChefHat className="w-12 h-12 text-primary" />
                <h2 className="text-2xl font-headline font-bold">Chefcito</h2>
                <p className="text-sm text-muted-foreground">123 Culinary Lane, Foodie City, 12345</p>
            </div>

            <Separator className="my-4"/>

            <div className="space-y-1 text-xs">
                <p><strong>{t('orders.table.order_id')}:</strong> #{order.id}</p>
                <p><strong>{t('orders.table.table')}:</strong> {order.table}</p>
                <p><strong>{t('orders.table.date')}:</strong> {format(new Date(order.createdAt), 'PPp')}</p>
                <p><strong>{t('orders.table.staff')}:</strong> {order.staffName || 'N/A'}</p>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
                {order.items.map(item => (
                    <div key={item.id} className="flex text-xs">
                        <div className="flex-1">
                            <p className="font-semibold">{(item.quantity + item.cookedCount)}x {item.menuItem.name}</p>
                             {item.selectedExtras && item.selectedExtras.length > 0 && (
                                <div className="pl-2 text-muted-foreground">
                                    {item.selectedExtras.map(extra => (
                                    <div key={extra.id}>+ {extra.name}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className="font-semibold">${getItemTotal(item).toFixed(2)}</p>
                    </div>
                ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                    <p>{t('pos.current_order.subtotal')}:</p>
                    <p>${subtotal.toFixed(2)}</p>
                </div>
                 <div className="flex justify-between">
                    <p>{t('pos.current_order.tax')}:</p>
                    <p>${tax.toFixed(2)}</p>
                </div>
                 <div className="flex justify-between font-bold text-sm">
                    <p>{t('pos.current_order.total')}:</p>
                    <p>${orderTotal.toFixed(2)}</p>
                </div>
            </div>

            <Separator className="my-4" />

            <div className="text-center text-xs text-muted-foreground">
                <p>{t('orders.receipt.thank_you')}</p>
            </div>
        </div>
        
        <DialogFooter className="p-4 bg-muted border-t flex-row justify-center sm:justify-center gap-2">
          <Button variant="outline" onClick={handlePrint} className="w-full">
              <Printer className="mr-2 h-4 w-4" />
              {t('orders.receipt.print')}
          </Button>
          <Button variant="secondary" onClick={handleDownload} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            {t('orders.receipt.download')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
