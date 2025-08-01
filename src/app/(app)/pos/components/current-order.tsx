
"use client"
import Image from 'next/image'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { type OrderItem, type Customer } from '@/lib/types'
import { MinusCircle, PlusCircle, Trash2, Send, CreditCard, Utensils } from 'lucide-react'
import { useI18n } from '@/context/i18n-context'
import type { useCurrentOrder } from '@/hooks/use-current-order'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Combobox } from '@/components/ui/combobox'
import { Label } from '@/components/ui/label'

interface CurrentOrderProps {
  order: ReturnType<typeof useCurrentOrder>;
  customers: Customer[];
  onSendToKitchen: () => void;
  onPayment: () => void;
}

export function CurrentOrder({ order, customers, onSendToKitchen, onPayment }: CurrentOrderProps) {
  const { t } = useI18n();
  const { items, subtotal, tax, total, updateQuantity, removeItem, clearOrder, table, setTable, customerId, setCustomerId } = order;
  
  const customerOptions = customers.map(c => ({ value: c.id, label: c.name }));

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline">{t('pos.current_order.title')}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <div className="grid grid-cols-2 gap-4 pb-4 border-b mb-4">
            <div>
                <Label htmlFor="table-select">{t('pos.current_order.table')}</Label>
                 <Select value={String(table)} onValueChange={(value) => setTable(Number(value))} name="table-select">
                    <SelectTrigger id="table-select">
                        <SelectValue placeholder={t('pos.current_order.select_table')} />
                    </SelectTrigger>
                    <SelectContent>
                        {Array.from({ length: 20 }, (_, i) => i + 1).map(tableNum => (
                        <SelectItem key={tableNum} value={String(tableNum)}>
                            {t('pos.current_order.table')} {tableNum}
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="customer-select">{t('pos.current_order.customer')}</Label>
                <Combobox 
                    options={customerOptions}
                    value={customerId}
                    onChange={(value) => setCustomerId(value || undefined)}
                    placeholder={t('pos.current_order.select_customer')}
                    searchPlaceholder={t('pos.current_order.search_customer')}
                    noResultsMessage={t('pos.current_order.no_customer_found')}
                />
            </div>
        </div>

        <ScrollArea className="flex-grow pr-4">
          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-10">
                <Utensils className="w-12 h-12 mb-4" />
                <p className="font-semibold">{t('pos.current_order.no_items')}</p>
                <p className="text-sm">{t('pos.current_order.select_items')}</p>
              </div>
            ) : (
              items.map(item => (
                <div key={item.id}>
                  <div className="flex items-center gap-4">
                    {item.menuItem.imageUrl ? (
                      <Image src={item.menuItem.imageUrl} alt={item.menuItem.name} width={48} height={48} className="rounded-md object-cover" data-ai-hint={item.menuItem.aiHint} />
                    ) : (
                       <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                        <Utensils className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-grow">
                      <p className="font-semibold">{item.menuItem.name}</p>
                      <p className="text-sm text-muted-foreground">${item.menuItem.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                      <span className="font-bold w-4 text-center">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/80 hover:text-destructive" onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-4 w-4"/>
                    </Button>
                  </div>
                  {item.selectedExtras && item.selectedExtras.length > 0 && (
                    <div className="pl-16 mt-1 text-sm text-muted-foreground">
                      <ul className="list-disc list-inside">
                        {item.selectedExtras.map(extra => (
                           <li key={extra.id}>{extra.name} (+${extra.price.toFixed(2)})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
      {items.length > 0 && (
        <CardFooter className="flex-col !p-4 border-t">
          <div className="w-full space-y-1 text-sm py-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('pos.current_order.subtotal')}</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('pos.current_order.tax')}</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-primary">
              <span>{t('pos.current_order.total')}</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
          <Separator className="my-2" />
          <div className="w-full grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={clearOrder}>{t('pos.current_order.clear_order')}</Button>
            <Button variant="secondary" onClick={onPayment}>
              <CreditCard className="mr-2 h-4 w-4" />
              {t('pos.current_order.payment')}
            </Button>
          </div>
          <Button className="w-full mt-2 bg-primary hover:bg-accent text-primary-foreground font-bold" onClick={onSendToKitchen}>
            <Send className="mr-2 h-4 w-4"/>
            {t('pos.current_order.send_to_kitchen')}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
