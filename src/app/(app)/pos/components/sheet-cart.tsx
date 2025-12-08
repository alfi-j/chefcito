"use client";

import React from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, PlusCircle, MinusCircle, X } from 'lucide-react';
import { useI18nStore } from '@/lib/stores/i18n-store';
import { type OrderItem, type OrderType, type DeliveryInfo, type MenuItem } from '@/lib/types';
import { useCurrentOrderStoreCompat as useCurrentOrderStore, useCurrentOrderTotalsCompat as useCurrentOrderTotals, useCurrentOrderItemCountByCategoryCompat as useCurrentOrderItemCountByCategory } from '@/lib/stores/current-order-store';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { CreditCard, Send, Utensils, Package, PersonStanding, StickyNote } from 'lucide-react';

interface SheetCartProps {
  onSendToKitchen: () => void;
  onPayment: () => void;
  onEditItem: (item: OrderItem) => void;
  sendButtonText?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SheetCart({ onSendToKitchen, onPayment, onEditItem, sendButtonText, open, onOpenChange }: SheetCartProps) {
  const { t } = useI18nStore();
  const { 
    items,
    table,
    setTable,
    notes,
    setNotes,
    orderType,
    setOrderType,
    deliveryInfo,
    setDeliveryInfo,
    clearOrder,
    updateItemQuantity,
    removeItem
  } = useCurrentOrderStore();
  
  const { subtotal, tax, total } = useCurrentOrderTotals();
  const itemCountByCategory = useCurrentOrderItemCountByCategory();
  
  const isDeliveryInfoComplete = !!(deliveryInfo.name && deliveryInfo.address && deliveryInfo.phone);
  const canSendToKitchen = items.length > 0 && (orderType === 'dine-in' || isDeliveryInfoComplete);
  const canMakePayment = items.length > 0;
  
  const handleQuantityChange = (itemId: string, adjustment: number, e: React.MouseEvent) => {
    e.stopPropagation();
    updateItemQuantity(itemId, adjustment);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {items.length > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full">
              {items.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent {...({} as any)} className="p-0 w-full md:max-w-md [&>button]:hidden">
        <div className="flex flex-col h-full">
          <ScrollArea className="h-full flex-1">
          <Card className="border-0 shadow-none h-full flex flex-col">
            <CardHeader className="p-4 border-b">
              <div className="flex justify-between items-center">
                <SheetTitle className="font-headline text-lg">
                  {t('pos.current_order.title')}
                </SheetTitle>
                {items.length > 0 && (
                  <Badge variant="secondary">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-0 flex-grow flex flex-col min-h-0">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground p-4">
                  <Utensils className="w-10 h-10 mb-2" />
                  <p className="font-semibold">{t('pos.current_order.no_items')}</p>
                  <p className="text-sm">{t('pos.current_order.select_items')}</p>
                </div>
              ) : (
                <>
                  <div className="p-4 flex-shrink-0">
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
                            <Input 
                              id="customer-name" 
                              value={deliveryInfo.name || ''} 
                              onChange={(e) => setDeliveryInfo({...deliveryInfo, name: e.target.value})} 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="customer-address">{t('pos.delivery.address')}</Label>
                            <Input 
                              id="customer-address" 
                              value={deliveryInfo.address || ''} 
                              onChange={(e) => setDeliveryInfo({...deliveryInfo, address: e.target.value})} 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="customer-phone">{t('pos.delivery.phone')}</Label>
                            <Input 
                              id="customer-phone" 
                              type="tel" 
                              value={deliveryInfo.phone || ''} 
                              onChange={(e) => setDeliveryInfo({...deliveryInfo, phone: e.target.value})} 
                            />
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                    
                    <div className="mt-4">
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
                    
                    {/* Category Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {Object.entries(itemCountByCategory).map(([category, count]) => (
                        <Badge key={category} variant="secondary">
                          {category}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="px-4 flex-grow overflow-hidden">
                    <ScrollArea className="h-full pb-4">
                      <div className="space-y-2">
                        {items.map((item: OrderItem) => (
                          <div 
                            key={item.id} 
                            onClick={() => onEditItem(item)} 
                            className="p-2 rounded-md hover:bg-muted/50 cursor-pointer relative"
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeItem(item.id);
                              }}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                            
                            <div className="flex items-start gap-3 w-full">
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6"
                                  onClick={(e) => handleQuantityChange(item.id, -1, e)}
                                >
                                  <MinusCircle className="h-3.5 w-3.5"/>
                                </Button>
                                <span className="font-bold text-base w-5 text-center">{item.quantity}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6"
                                  onClick={(e) => handleQuantityChange(item.id, 1, e)}
                                >
                                  <PlusCircle className="h-3.5 w-3.5"/>
                                </Button>
                              </div>
                              
                              <div className="flex-grow min-w-0">
                                <p className="font-semibold text-sm leading-tight">{item.menuItem.name}</p>
                                {item.selectedExtras && item.selectedExtras.length > 0 && (
                                  <div className="mt-0.5 text-xs text-muted-foreground">
                                    {item.selectedExtras.map((extra: MenuItem) => (
                                      <div key={extra.id}>+ {extra.name} (${extra.price.toFixed(2)})</div>
                                    ))}
                                  </div>
                                )}
                                {item.notes && (
                                  <div className="mt-0.5 text-xs text-muted-foreground flex items-start gap-1.5">
                                    <StickyNote className="w-3 h-3 mt-0.5 text-primary/80 flex-shrink-0"/>
                                    <p className="italic truncate">{item.notes}</p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-sm font-semibold ml-auto pr-8">
                                ${((item.menuItem.price + (item.selectedExtras?.reduce((acc: number, e: MenuItem) => acc + e.price, 0) || 0)) * item.quantity).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </>
              )}
            </CardContent>
            
            {items.length > 0 && (
              <CardFooter className="flex-col !p-4 border-t bg-card flex-shrink-0">
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
                  <Button variant="secondary" onClick={onPayment} disabled={!canMakePayment}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {t('pos.current_order.payment')}
                  </Button>
                </div>
                <Button className="w-full mt-2" onClick={onSendToKitchen} disabled={!canSendToKitchen}>
                  <Send className="mr-2 h-4 w-4"/>
                  {sendButtonText || t('pos.current_order.send_to_kitchen')}
                </Button>
              </CardFooter>
            )}
          </Card>
        </ScrollArea>
          </div>
      </SheetContent>
    </Sheet>
  );
}