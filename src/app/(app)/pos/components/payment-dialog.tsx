
"use client";

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useI18n } from '@/context/i18n-context';
import { CreditCard, DollarSign, Users, PlusCircle, Trash2, Landmark, CheckCircle, CircleDashed, Check } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getPaymentMethods } from '@/lib/mock-data';
import { type PaymentMethod, type OrderItem } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


interface PaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orderItems: OrderItem[];
  totalAmount: number;
  onConfirmPayment: () => void;
}

const calculateItemTotal = (item: OrderItem) => {
    const extrasPrice = item.selectedExtras?.reduce((acc, extra) => acc + extra.price, 0) || 0;
    const totalUnits = item.quantity || 0;
    return (item.menuItem.price + extrasPrice) * totalUnits;
};

export function PaymentDialog({ isOpen, onOpenChange, totalAmount, onConfirmPayment, orderItems: originalOrderItems }: PaymentDialogProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [isSplittingBill, setIsSplittingBill] = useState(false);
  const [splits, setSplits] = useState<any[]>([]);
  const [items, setItems] = useState<OrderItem[]>(originalOrderItems.map(item => ({...item})));

  const { t } = useI18n();
  
  useEffect(() => {
    const methods = paymentMethods.filter(method => method.enabled);
    if (methods.length > 0) {
      setPaymentMethod(methods[0].id);
    }
  }, [paymentMethods]);

  useEffect(() => {
    if (isOpen) {
      const fetchMethods = async () => {
          const methods = (await getPaymentMethods()).filter(m => m.enabled);
          setPaymentMethods(methods);
          if (methods.length > 0) {
            setPaymentMethod(methods[0].id);
          }
      }
      fetchMethods();
      setItems(originalOrderItems.map(item => ({...item})));
    }
  }, [isOpen, originalOrderItems]);
  

  

  
  const canConfirm = !!paymentMethod;

  const getIconForMethod = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'card': return <CreditCard className="h-5 w-5" />;
      case 'cash': return <DollarSign className="h-5 w-5" />;
      default: return null;
    }
  }


  const handleConfirmPayment = async () => {
    if (!paymentMethod) return;
    
    try {
      await onConfirmPayment();
      onOpenChange(false);
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  const handleSplitBill = () => {
    setIsSplittingBill(!isSplittingBill);
  }


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="font-headline text-2xl">{t('pos.payment_dialog.title')}</DialogTitle>
           <DialogDescription>
            {t('pos.payment_dialog.total_due')}: 
            <span className="font-bold text-primary ml-2 text-lg">${totalAmount.toFixed(2)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4 px-4 min-h-0 overflow-hidden">
            <ScrollArea className="h-full -mx-4">
                <div className="space-y-3 px-4">
                    <div>
                        <Label className="font-semibold text-base">{t('pos.payment_dialog.method')}</Label>
                        <RadioGroup 
                        className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2"
                        onValueChange={setPaymentMethod}
                        value={paymentMethod}
                        >
                        {paymentMethods.map(method => (
                            <div key={method.id}>
                            <RadioGroupItem value={method.id} id={method.id} className="peer sr-only" />
                            <Label
                                htmlFor={method.id}
                                className="flex items-center gap-3 rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                                {getIconForMethod(method.type)}
                                <span className="font-semibold">{method.name}</span>
                                <Check className="h-4 w-4 ml-auto text-primary opacity-0 peer-data-[state=checked]:opacity-100" />
                            </Label>
                            </div>
                        ))}
                        </RadioGroup>
                    </div>
                </div>
            </ScrollArea>

            {/* Right Side: Order Summary / Item Assignment */}
            <ScrollArea className="h-full -mx-4">
              <div className="space-y-3 px-4">
                {/* Order Summary */}
                <div className="border rounded-lg mt-4">
                  <div className="p-4 border-b">
                    <h4 className="font-medium">{t('pos.payment_dialog.order_summary')}</h4>
                  </div>
                  
                  <div className="space-y-3 px-4 py-4">
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-3">
                        {items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">{item.quantity}x {item.menuItem.name}</div>
                              {item.selectedExtras && item.selectedExtras.length > 0 && (
                                <div className="text-sm text-muted-foreground">
                                  {item.selectedExtras.map(extra => extra.name).join(', ')}
                                </div>
                              )}
                            </div>
                            <div className="font-medium">
                              ${calculateItemTotal(item).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center pt-2">
                      <div className="text-lg font-bold">{t('pos.payment_dialog.total')}</div>
                      <div className="text-lg font-bold text-primary">
                        ${totalAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Split Bill */}
                <div className="border rounded-lg mt-4">
                  <div className="p-4 border-b">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{t('pos.payment_dialog.split_bill')}</h4>
                      <Button size="sm" onClick={handleSplitBill}>
                        {isSplittingBill ? t('pos.payment_dialog.cancel_split') : t('pos.payment_dialog.add_split')}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 px-4 py-4">
                    <div className="flex justify-between items-center">
                      <div className="font-medium">{t('pos.payment_dialog.split_amount')}</div>
                      <div className="font-medium text-primary">
                        ${totalAmount.toFixed(2)}
                      </div>
                    </div>

                    {isSplittingBill && (
                      <div className="space-y-3">
                        {splits.map((split) => (
                          <div key={split.id} className="border rounded-md p-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">Split {split.id}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <div className="font-medium">{t('pos.payment_dialog.split_amount')}</div>
                              <div className="font-medium text-primary">
                                ${totalAmount.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </ScrollArea>
        </div>

        <DialogFooter className="p-4 pt-4 border-t !flex-row !justify-between items-center bg-background">
          <div className="text-xl font-bold">
              {t('pos.payment_dialog.total_due')}: <span className="text-primary">${totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t('dialog.cancel')}</Button>
            <Button onClick={handleConfirmPayment} disabled={!canConfirm}>
              {t('pos.payment_dialog.confirm')}
            </Button>

          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
