
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
import { CreditCard, DollarSign, Users, PlusCircle, Trash2, Landmark, CheckCircle, CircleDashed } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getPaymentMethods } from '@/lib/mock-data';
import { PaymentMethod, type OrderItem, type BillSplit } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';


interface PaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orderItems: OrderItem[];
  totalAmount: number;
  onConfirmPayment: () => void;
}

const calculateItemTotal = (item: OrderItem) => {
    const extrasPrice = item.selectedExtras?.reduce((acc, extra) => acc + extra.price, 0) || 0;
    return (item.menuItem.price + extrasPrice) * item.quantity;
};

export function PaymentDialog({ isOpen, onOpenChange, totalAmount, onConfirmPayment, orderItems }: PaymentDialogProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [isSplittingBill, setIsSplittingBill] = useState(false);
  
  const [splits, setSplits] = useState<BillSplit[]>([]);
  const [activeSplitIndex, setActiveSplitIndex] = useState(0);

  const { t } = useI18n();
  
  const initializeSplits = (count: number) => {
     const newSplits = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      items: [],
      total: 0,
    }));
    setSplits(newSplits);
    setActiveSplitIndex(0);
  }

  useEffect(() => {
    if (isOpen) {
      const methods = getPaymentMethods().filter(m => m.enabled);
      setPaymentMethods(methods);
      if (methods.length > 0) {
        const defaultMethod = methods[0];
        setSelectedMethod(defaultMethod);
        if (defaultMethod.type === 'bank_transfer' && defaultMethod.banks && defaultMethod.banks.length > 0) {
          setSelectedBank(defaultMethod.banks[0]);
        } else {
          setSelectedBank('');
        }
      }
      setIsSplittingBill(false);
      setSplits([]);
      setActiveSplitIndex(0);
    }
  }, [isOpen, totalAmount]);
  
  const handleMethodChange = (value: string) => {
    const method = paymentMethods.find(m => m.id === value);
    if(method) {
      setSelectedMethod(method);
       if (method.type === 'bank_transfer' && method.banks && method.banks.length > 0) {
        setSelectedBank(method.banks[0]);
      } else {
        setSelectedBank('');
      }
    }
  }

  const handleSplitToggle = (checked: boolean) => {
    setIsSplittingBill(checked);
    if (checked) {
      initializeSplits(2);
    } else {
      setSplits([]);
    }
  }

  const addSplit = () => {
    setSplits(s => [...s, { id: Date.now(), items: [], total: 0 }]);
  }

  const removeSplit = (id: number) => {
    setSplits(s => {
      const newSplits = s.filter(split => split.id !== id);
      if (activeSplitIndex >= newSplits.length) {
        setActiveSplitIndex(Math.max(0, newSplits.length - 1));
      }
      return newSplits;
    });
  }

  const handleItemToggle = (item: OrderItem, checked: boolean) => {
    setSplits(currentSplits => {
      const newSplits = [...currentSplits];

      // Remove item from any split it might be in
      for (const split of newSplits) {
        const itemIndex = split.items.findIndex(i => i.id === item.id);
        if (itemIndex > -1) {
          split.items.splice(itemIndex, 1);
        }
      }

      // Add item to the active split if checked
      if (checked) {
        newSplits[activeSplitIndex].items.push(item);
      }
      
      // Recalculate totals
      return newSplits.map(split => ({
        ...split,
        total: split.items.reduce((acc, currentItem) => acc + calculateItemTotal(currentItem), 0)
      }));
    });
  };

  const allItemsAssigned = useMemo(() => {
    if (!isSplittingBill) return true; // Not splitting, so all items are covered
    const assignedItemIds = new Set(splits.flatMap(s => s.items.map(i => i.id)));
    return orderItems.length === assignedItemIds.size;
  }, [splits, orderItems, isSplittingBill]);
  
  const canConfirm = !isSplittingBill || allItemsAssigned;

  const getIconForMethod = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'card': return <CreditCard className="mb-3 h-6 w-6" />;
      case 'cash': return <DollarSign className="mb-3 h-6 w-6" />;
      case 'bank_transfer': return <Landmark className="mb-3 h-6 w-6" />;
      default: return null;
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{t('pos.payment_dialog.title')}</DialogTitle>
           <DialogDescription>
            {t('pos.payment_dialog.total_due')}: 
            <span className="font-bold text-primary ml-2 text-lg">${totalAmount.toFixed(2)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Side: Payment and Bill Splitting */}
            <div className="space-y-4">
                 <div>
                    <Label className="font-semibold">{t('pos.payment_dialog.method')}</Label>
                    <RadioGroup 
                    className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3"
                    onValueChange={handleMethodChange}
                    value={selectedMethod?.id}
                    >
                    {paymentMethods.map(method => (
                        <div key={method.id}>
                        <RadioGroupItem value={method.id} id={method.id} className="peer sr-only" />
                        <Label
                            htmlFor={method.id}
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                            {getIconForMethod(method.type)}
                            {method.name}
                        </Label>
                        </div>
                    ))}
                    </RadioGroup>
                </div>

                {selectedMethod?.type === 'bank_transfer' && (
                    <div className="space-y-2">
                        <Label htmlFor="bank" className="font-semibold">{t('pos.payment_dialog.bank')}</Label>
                        <Select value={selectedBank} onValueChange={setSelectedBank}>
                        <SelectTrigger id="bank">
                            <SelectValue placeholder={t('pos.payment_dialog.select_bank')} />
                        </SelectTrigger>
                        <SelectContent>
                            {selectedMethod.banks?.map(bank => (
                            <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                )}
                
                <Separator />
                
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <Switch id="split-bill-switch" checked={isSplittingBill} onCheckedChange={handleSplitToggle} />
                            <Label htmlFor="split-bill-switch" className="font-semibold flex items-center gap-2"><Users className="h-5 w-5"/>{t('pos.payment_dialog.split_bill')}</Label>
                        </div>
                    </div>
                    {isSplittingBill && (
                        <div>
                             <ScrollArea className="h-40 border rounded-md p-2">
                                <div className="space-y-2">
                                {splits.map((split, index) => (
                                    <div 
                                        key={split.id}
                                        className={cn(
                                            "flex justify-between items-center p-2 rounded-md cursor-pointer",
                                            activeSplitIndex === index ? "bg-primary/10 border border-primary" : "hover:bg-muted/50"
                                        )}
                                        onClick={() => setActiveSplitIndex(index)}
                                    >
                                        <div className="font-semibold">
                                            {t('pos.payment_dialog.bill')} {index + 1}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-primary">${split.total.toFixed(2)}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-destructive/70 hover:text-destructive"
                                                onClick={(e) => { e.stopPropagation(); removeSplit(split.id); }}
                                                disabled={splits.length <= 1}
                                            >
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            </ScrollArea>
                            <Button variant="outline" size="sm" onClick={addSplit} className="mt-2">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                {t('pos.payment_dialog.add_bill')}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side: Item Assignment */}
            <div className="space-y-4">
                <Label className="font-semibold">{isSplittingBill ? `${t('pos.payment_dialog.assign_items_for')} ${t('pos.payment_dialog.bill')} ${activeSplitIndex + 1}` : t('pos.payment_dialog.order_summary')}</Label>
                <ScrollArea className="h-64 border rounded-md p-2">
                    <div className="space-y-3">
                        {orderItems.map(item => {
                            const itemIsInActiveSplit = splits[activeSplitIndex]?.items.some(i => i.id === item.id);
                            const itemIsAssignedToAnotherSplit = splits.some((split, index) => index !== activeSplitIndex && split.items.some(i => i.id === item.id));

                            return (
                                <div key={item.id} className="flex items-center gap-3">
                                    <Checkbox
                                        id={`item-${item.id}`}
                                        checked={itemIsInActiveSplit}
                                        onCheckedChange={(checked) => handleItemToggle(item, !!checked)}
                                        disabled={!isSplittingBill || itemIsAssignedToAnotherSplit}
                                    />
                                    <Label 
                                        htmlFor={`item-${item.id}`}
                                        className={cn(
                                            "flex-1 flex justify-between items-center cursor-pointer",
                                            (!isSplittingBill || itemIsAssignedToAnotherSplit) && "cursor-not-allowed opacity-50"
                                        )}
                                    >
                                        <span>{item.quantity}x {item.menuItem.name}</span>
                                        <span>${calculateItemTotal(item).toFixed(2)}</span>
                                    </Label>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
                 {isSplittingBill && (
                    <div className={cn(
                        "flex items-center gap-2 text-sm font-medium",
                        allItemsAssigned ? "text-green-600" : "text-destructive"
                    )}>
                        {allItemsAssigned ? <CheckCircle className="h-4 w-4"/> : <CircleDashed className="h-4 w-4"/>}
                        <span>{allItemsAssigned ? t('pos.payment_dialog.all_items_assigned') : t('pos.payment_dialog.items_unassigned')}</span>
                    </div>
                 )}
            </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('dialog.cancel')}</Button>
          <Button onClick={onConfirmPayment} disabled={!canConfirm || (selectedMethod?.type === 'bank_transfer' && !selectedBank)}>{t('pos.payment_dialog.confirm')} ${totalAmount.toFixed(2)}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    