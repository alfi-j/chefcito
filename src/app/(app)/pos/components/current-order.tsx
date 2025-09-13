"use client"

import React, { useMemo } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Minus, Plus, CreditCard, Send, StickyNote } from "lucide-react"
import { useI18n } from '@/context/i18n-context';
import { type OrderItem } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCurrentOrder } from '@/hooks/use-current-order';

interface CurrentOrderProps {
  order: ReturnType<typeof useCurrentOrder>;
  onSendToKitchen: () => void;
  onPayment: () => void;
  onEditItem: (item: OrderItem) => void;
}

export function CurrentOrder({ order, onSendToKitchen, onPayment, onEditItem }: CurrentOrderProps) {
  const { t } = useI18n();
  
  const canSendToKitchen = order.items.length > 0;
  const canMakePayment = order.items.length > 0;

  const handleIncrement = (itemId: string) => {
    const item = order.items.find(i => i.id === itemId);
    if (item) {
      order.updateItemQuantity(itemId, item.quantity + 1);
    }
  };

  const handleDecrement = (itemId: string) => {
    const item = order.items.find(i => i.id === itemId);
    if (item && item.quantity > 1) {
      order.updateItemQuantity(itemId, item.quantity - 1);
    } else if (item && item.quantity === 1) {
      order.removeItem(itemId);
    }
  };

  const calculateItemTotal = (item: OrderItem): number => {
    const basePrice = typeof item.menuItem.price === 'string' 
      ? parseFloat(item.menuItem.price) 
      : item.menuItem.price;
      
    const extrasPrice = item.selectedExtras?.reduce((acc, extra) => {
      const extraPrice = typeof extra.price === 'string' 
        ? parseFloat(extra.price) 
        : extra.price;
      return acc + extraPrice;
    }, 0) || 0;
    
    return (basePrice + extrasPrice) * item.quantity;
  };

  const { subtotal, tax, total } = useMemo(() => {
    const currentSubtotal = order.items.reduce((acc, item) => {
      return acc + calculateItemTotal(item);
    }, 0);
    const currentTax = currentSubtotal * 0.08;
    const currentTotal = currentSubtotal + currentTax;
    return { subtotal: currentSubtotal, tax: currentTax, total: currentTotal };
  }, [order.items]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="font-headline">{t('pos.current_order.title')}</CardTitle>
        {order.items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={order.clearOrder}>
            {t('pos.current_order.clear_order')}
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-grow flex flex-col min-h-0">
        {order.items.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
            <div className="bg-muted rounded-full p-4 mb-4">
              <StickyNote className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">{t('pos.current_order.no_items')}</h3>
            <p className="text-sm text-muted-foreground">{t('pos.current_order.select_items')}</p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-grow">
              <div className="space-y-3">
                {order.items.map((item) => (
                  <Card key={item.id} className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.menuItem.name}</div>
                        {item.selectedExtras && item.selectedExtras.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.selectedExtras.map(extra => extra.name).join(', ')}
                          </div>
                        )}
                        {item.notes && (
                          <div className="text-xs text-muted-foreground mt-1 italic">
                            {item.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-2">
                        <div className="flex items-center space-x-1">
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleDecrement(item.id)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleIncrement(item.id)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2"
                          onClick={() => onEditItem(item)}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                    <div className="text-right font-medium text-sm mt-1">
                      ${calculateItemTotal(item).toFixed(2)}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
            
            <Separator className="my-3" />
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('pos.current_order.subtotal')}</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t('pos.current_order.tax')}</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>{t('pos.current_order.total')}</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
      
      {order.items.length > 0 && (
        <CardFooter className="flex-col gap-3">
          <div className="w-full space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="table-number">{t('pos.current_order.table')}</Label>
                <Input 
                  id="table-number"
                  type="number" 
                  min="1"
                  value={order.table} 
                  onChange={(e) => order.setTable(parseInt(e.target.value) || 1)} 
                />
              </div>
              
              <div className="space-y-2">
                <Label>{t('pos.current_order.customer')}</Label>
                <Input 
                  type="text" 
                  placeholder={t('pos.current_order.customer')}
                  value={order.customerName || ''} 
                  onChange={(e) => order.setCustomerName(e.target.value)} 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>{t('pos.current_order.order_type')}</Label>
              <RadioGroup 
                value={order.orderType} 
                onValueChange={(value: any) => order.setOrderType(value)}
                className="grid grid-cols-3 gap-2"
              >
                <div>
                  <RadioGroupItem value="dine-in" id="dine-in" className="peer sr-only" />
                  <Label
                    htmlFor="dine-in"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <span>{t('pos.order_type.dine_in')}</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="delivery" id="delivery" className="peer sr-only" />
                  <Label
                    htmlFor="delivery"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <span>{t('pos.order_type.delivery')}</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="takeaway" id="takeaway" className="peer sr-only" />
                  <Label
                    htmlFor="takeaway"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <span>{t('pos.order_type.takeaway')}</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            {order.orderType === 'delivery' && (
              <div className="space-y-2 border rounded-lg p-3">
                <h4 className="font-medium">{t('pos.delivery.title')}</h4>
                <div className="grid grid-cols-1 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="delivery-name">{t('pos.delivery.name')}</Label>
                    <Input
                      id="delivery-name"
                      value={order.deliveryInfo.name}
                      onChange={(e) => order.setDeliveryInfo({...order.deliveryInfo, name: e.target.value})}
                      placeholder={t('pos.delivery.name')}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="delivery-address">{t('pos.delivery.address')}</Label>
                    <Input
                      id="delivery-address"
                      value={order.deliveryInfo.address}
                      onChange={(e) => order.setDeliveryInfo({...order.deliveryInfo, address: e.target.value})}
                      placeholder={t('pos.delivery.address')}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="delivery-phone">{t('pos.delivery.phone')}</Label>
                    <Input
                      id="delivery-phone"
                      value={order.deliveryInfo.phone}
                      onChange={(e) => order.setDeliveryInfo({...order.deliveryInfo, phone: e.target.value})}
                      placeholder={t('pos.delivery.phone')}
                    />
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="order-notes">{t('pos.current_order.order_notes')}</Label>
              <Textarea
                id="order-notes"
                value={order.notes}
                onChange={(e) => order.setNotes(e.target.value)}
                placeholder={t('pos.current_order.order_notes_placeholder')}
              />
            </div>
          </div>
          
          <Separator className="my-2" />
          
          <div className="w-full grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={order.clearOrder}>{t('pos.current_order.clear_order')}</Button>
            <Button variant="secondary" onClick={onPayment} disabled={!canMakePayment}>
              <CreditCard className="mr-2 h-4 w-4" />
              {t('pos.current_order.payment')}
            </Button>
          </div>
          <Button className="w-full" onClick={onSendToKitchen} disabled={!canSendToKitchen}>
            <Send className="mr-2 h-4 w-4"/>
            {t('pos.current_order.send_to_kitchen')}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}