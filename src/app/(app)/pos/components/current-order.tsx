<<<<<<< HEAD
"use client"

import React, { useMemo } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
=======

"use client"
import Image from 'next/image'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { type OrderItem, type OrderType, type DeliveryInfo } from '@/lib/types'
import { safeGet } from '@/lib/utils'
import { Send, CreditCard, Utensils, StickyNote, Package, PersonStanding, PlusCircle, MinusCircle } from 'lucide-react'
import { useI18n } from '@/context/i18n-context'
import type { useCurrentOrder } from '@/hooks/use-current-order'
import {
>>>>>>> d3399ff (Chefcito Beta!)
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
<<<<<<< HEAD
import { Minus, Plus, CreditCard, Send, StickyNote } from "lucide-react"
import { useI18n } from '@/context/i18n-context';
import { type OrderItem } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCurrentOrder } from '@/hooks/use-current-order';
=======
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
>>>>>>> d3399ff (Chefcito Beta!)

interface CurrentOrderProps {
  order: ReturnType<typeof useCurrentOrder>;
  onSendToKitchen: () => void;
  onPayment: () => void;
  onEditItem: (item: OrderItem) => void;
}

export function CurrentOrder({ order, onSendToKitchen, onPayment, onEditItem }: CurrentOrderProps) {
  const { t } = useI18n();
<<<<<<< HEAD
  
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
=======
  const { 
    items, subtotal, tax, total, clearOrder, 
    table, setTable, notes, setNotes,
    orderType, setOrderType, deliveryInfo, setDeliveryInfo,
    updateItemQuantity
  } = order;
  
  const isDeliveryInfoComplete = !!(deliveryInfo.name && deliveryInfo.address && deliveryInfo.phone);
  const canSendToKitchen = items.length > 0 && (orderType === 'dine-in' || isDeliveryInfoComplete);
  const canMakePayment = items.length > 0;
  
  const handleQuantityChange = (itemId: string, adjustment: number, e: React.MouseEvent) => {
    e.stopPropagation();
    updateItemQuantity(itemId, adjustment);
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline">{t('pos.current_order.title')}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-grow pr-4 -mr-4">
          <div className='flex-shrink-0 pr-4 space-y-4'>
            <Tabs value={orderType} onValueChange={(value) => setOrderType(value as OrderType)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="dine-in">
                        <PersonStanding className="mr-2 h-4 w-4"/>
                        {t('pos.order_type.dine_in')}
                    </TabsTrigger>
                    <TabsTrigger value="delivery">
                        <Package className="mr-2 h-4 w-4"/>
                        {t('pos.order_type.delivery')}
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="dine-in" className="pt-4">
                    <div className="space-y-2">
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
                </TabsContent>
                <TabsContent value="delivery" className="pt-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="customer-name">{t('pos.delivery.name')}</Label>
                            <Input id="customer-name" value={deliveryInfo.name} onChange={(e) => setDeliveryInfo(d => ({...d, name: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="customer-address">{t('pos.delivery.address')}</Label>
                            <Input id="customer-address" value={deliveryInfo.address} onChange={(e) => setDeliveryInfo(d => ({...d, address: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="customer-phone">{t('pos.delivery.phone')}</Label>
                            <Input id="customer-phone" type="tel" value={deliveryInfo.phone} onChange={(e) => setDeliveryInfo(d => ({...d, phone: e.target.value}))} />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
            
            <div className="mt-2">
                <Label htmlFor="order-notes">{t('pos.current_order.order_notes')}</Label>
                <Textarea 
                    id="order-notes"
                    placeholder={t('pos.current_order.order_notes_placeholder')}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1"
                />
            </div>
          
            <Separator className="my-4" />

            <div className="space-y-2 pr-0">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-10">
                  <Utensils className="w-12 h-12 mb-4" />
                  <p className="font-semibold">{t('pos.current_order.no_items')}</p>
                  <p className="text-sm">{t('pos.current_order.select_items')}</p>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.id} onClick={() => onEditItem(item)} className="p-2 -mx-2 rounded-md hover:bg-muted/50 cursor-pointer">
                    <div className="flex items-start gap-3">
                       <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => handleQuantityChange(item.id, -1, e)}>
                          <MinusCircle className="h-3.5 w-3.5"/>
                        </Button>
                        <span className="font-bold text-base w-5 text-center">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => handleQuantityChange(item.id, 1, e)}>
                          <PlusCircle className="h-3.5 w-3.5"/>
                        </Button>
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-semibold text-sm leading-tight">{safeGet(item, 'menuItem.name', 'Unknown Item')}</p>
                        {item.selectedExtras && item.selectedExtras.length > 0 && (
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {item.selectedExtras.map(extra => (
                              <div key={extra.id}>
                                + {safeGet(extra, 'name', 'Unknown Extra')} (${
                                  typeof extra.price === 'string' 
                                    ? parseFloat(extra.price).toFixed(2) 
                                    : extra.price.toFixed(2)
                                })
                              </div>
                            ))}
                          </div>
                        )}
                        {item.notes && (
                          <p className="mt-0.5 text-xs text-primary/80 italic">Notes: {item.notes}</p>
                        )}
                      </div>
                      <div className="text-right font-semibold">
                        ${
                          (
                            safeGet(item, 'menuItem.price', 0) + 
                            (item.selectedExtras?.reduce((acc, e) => acc + safeGet(e, 'price', 0), 0) || 0)
                          ).toFixed(2)
                        }
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
      {items.length > 0 && (
        <CardFooter className="flex-col !p-4 border-t bg-card">
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
>>>>>>> d3399ff (Chefcito Beta!)
            <Button variant="secondary" onClick={onPayment} disabled={!canMakePayment}>
              <CreditCard className="mr-2 h-4 w-4" />
              {t('pos.current_order.payment')}
            </Button>
          </div>
<<<<<<< HEAD
          <Button className="w-full" onClick={onSendToKitchen} disabled={!canSendToKitchen}>
=======
          <Button className="w-full mt-2" onClick={onSendToKitchen} disabled={!canSendToKitchen}>
>>>>>>> d3399ff (Chefcito Beta!)
            <Send className="mr-2 h-4 w-4"/>
            {t('pos.current_order.send_to_kitchen')}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> d3399ff (Chefcito Beta!)
