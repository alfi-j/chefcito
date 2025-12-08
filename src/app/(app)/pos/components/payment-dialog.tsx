
"use client";

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useI18nStore } from '@/lib/stores/i18n-store';
import { CreditCard, DollarSign, Users, PlusCircle, Trash2, Landmark, CheckCircle, CircleDashed, Check } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/helpers';
import { type OrderItem, type Payment } from '@/lib/types';
import { useCurrentOrderTotalsCompat as useCurrentOrderTotals } from '@/lib/stores/current-order-store';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

interface PaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orderItems: OrderItem[];
  totalAmount: number;
  onConfirmPayment: (paymentData: { method: Payment; amount: number; splitDetails?: any[] }) => void;
  paymentMethods: Payment[];
}

const getIconForMethod = (type: string) => {
  switch (type) {
    case 'card': return <CreditCard className="h-4 w-4" />;
    case 'bank_transfer': return <Landmark className="h-4 w-4" />;
    default: return <DollarSign className="h-4 w-4" />;
  }
};

export function PaymentDialog({ isOpen, onOpenChange, orderItems, totalAmount, onConfirmPayment, paymentMethods }: PaymentDialogProps) {
  const { t } = useI18nStore();
  const { subtotal, tax } = useCurrentOrderTotals();
  
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [splitMethod, setSplitMethod] = useState<'equally' | 'by_item' | 'by_person'>('equally');
  const [numPeople, setNumPeople] = useState<number>(2);
  const [splitDetails, setSplitDetails] = useState<{ itemId: string; person: number }[]>([]);
  const [amount, setAmount] = useState<string>('');
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [bills, setBills] = useState<{ id: number; items: { itemId: string; quantity: number }[]; amount: number }[]>([{ id: 1, items: [], amount: 0 }]);
  const [activeBillId, setActiveBillId] = useState<number>(1);
  
  const selectedMethod = paymentMethods.find(m => m.id === selectedMethodId);

  const handleMethodChange = (value: string) => {
    setSelectedMethodId(value);
    setSelectedBank('');
  }

  const handleSplitMethodChange = (value: 'equally' | 'by_item' | 'by_person') => {
    setSplitMethod(value);
    if (value === 'equally') {
      setBills([{ id: 1, items: [], amount: 0 }]);
      setActiveBillId(1);
    }
  }

  const handleAddBill = () => {
    const newBillId = bills.length + 1;
    setBills([...bills, { id: newBillId, items: [], amount: 0 }]);
    setActiveBillId(newBillId);
  }

  const handleRemoveBill = (id: number) => {
    if (bills.length === 1) return;
    setBills(bills.filter(bill => bill.id !== id));
    setActiveBillId(bills[0].id);
  }

  const handleAssignItem = (itemId: string, person: number) => {
    setSplitDetails(currentDetails => {
      const existingDetail = currentDetails.find(detail => detail.itemId === itemId);
      if (existingDetail) {
        return currentDetails.map(detail => detail.itemId === itemId ? { ...detail, person } : detail);
      } else {
        return [...currentDetails, { itemId, person }];
      }
    });
  }

  const handleItemQuantityChange = (itemId: string, quantity: number) => {
    setBills(currentBills => {
      return currentBills.map(bill => {
        if (bill.id === activeBillId) {
          const existingItem = bill.items.find(item => item.itemId === itemId);
          const orderItem = orderItems.find(orderItem => orderItem.id === itemId);
          if (!orderItem) return bill;
          
          if (existingItem) {
            return {
              ...bill,
              items: bill.items.map(item => item.itemId === itemId ? { ...item, quantity } : item),
              amount: bill.amount + (quantity - existingItem.quantity) * orderItem.menuItem.price,
            };
          } else {
            return {
              ...bill,
              items: [...bill.items, { itemId, quantity }],
              amount: bill.amount + quantity * orderItem.menuItem.price,
            };
          }
        }
        return bill;
      });
    });
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  }

  const handleBankChange = (value: string) => {
    setSelectedBank(value);
  }

  const handleConfirm = () => {
    if (!selectedMethod) return;
    if (selectedMethod?.type === 'bank_transfer' && !selectedBank) return;
    if (splitMethod === 'equally' && bills[0].amount !== totalAmount) return;
    if (splitMethod === 'by_item' && splitDetails.length !== orderItems.length) return;
    if (splitMethod === 'by_person' && bills.reduce((acc, bill) => acc + bill.amount, 0) !== totalAmount) return;

    const paymentData = {
      method: selectedMethod,
      amount: Number(amount) || totalAmount,
      splitDetails: splitMethod === 'equally' ? undefined : splitMethod === 'by_item' ? splitDetails : bills,
    };

    onConfirmPayment(paymentData);
    onOpenChange(false);
  }

  const canConfirm = () => {
    if (selectedMethod?.type === 'bank_transfer' && !selectedBank) return false;
    if (splitMethod === 'equally' && bills[0].amount !== totalAmount) return false;
    if (splitMethod === 'by_item' && splitDetails.length !== orderItems.length) return false;
    if (splitMethod === 'by_person' && bills.reduce((acc, bill) => acc + bill.amount, 0) !== totalAmount) return false;
    return true;
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
                {/* Left Side: Payment and Bill Splitting */}
                <div className="space-y-3 px-4">
                    <div>
                        <Label className="font-semibold text-base">{t('pos.payment_dialog.method')}</Label>
                        <RadioGroup 
                        className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2"
                        onValueChange={handleMethodChange}
                        value={selectedMethodId}
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

                    {selectedMethod?.type === 'bank_transfer' && (
                        <div className="space-y-2">
                            <Label htmlFor="bank" className="font-semibold text-base">{t('pos.payment_dialog.bank')}</Label>
                            <Select value={selectedBank} onValueChange={handleBankChange}>
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
                                <Switch id="split-bill-switch" checked={splitMethod !== 'equally'} onCheckedChange={() => handleSplitMethodChange(splitMethod === 'equally' ? 'by_item' : 'equally')} />
                                <Label htmlFor="split-bill-switch" className="font-semibold flex items-center gap-2 text-base"><Users className="h-5 w-5"/>{t('pos.payment_dialog.split_bill')}</Label>
                            </div>
                        </div>
                        {splitMethod !== 'equally' && (
                            <div className="space-y-2">
                                <RadioGroup 
                                className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                                onValueChange={handleSplitMethodChange}
                                value={splitMethod}
                                >
                                <div>
                                <RadioGroupItem value="by_item" id="by-item" className="peer sr-only" />
                                <Label
                                    htmlFor="by-item"
                                    className="flex items-center gap-3 rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                >
                                    <span className="font-semibold">{t('pos.payment_dialog.by_item')}</span>
                                    <Check className="h-4 w-4 ml-auto text-primary opacity-0 peer-data-[state=checked]:opacity-100" />
                                </Label>
                                </div>
                                <div>
                                <RadioGroupItem value="by_person" id="by-person" className="peer sr-only" />
                                <Label
                                    htmlFor="by-person"
                                    className="flex items-center gap-3 rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                >
                                    <span className="font-semibold">{t('pos.payment_dialog.by_person')}</span>
                                    <Check className="h-4 w-4 ml-auto text-primary opacity-0 peer-data-[state=checked]:opacity-100" />
                                </Label>
                                </div>
                                </RadioGroup>
                                {splitMethod === 'by_person' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="num-people" className="font-semibold text-base">{t('pos.payment_dialog.num_people')}</Label>
                                        <Input type="number" id="num-people" value={numPeople} onChange={(e) => setNumPeople(Number(e.target.value))} className="w-full" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </ScrollArea>

            {/* Right Side: Order Summary / Item Assignment */}
            <ScrollArea className="h-full -mx-4">
              <div className="space-y-3 px-4">
                {splitMethod === 'equally' ? (
                  <>
                    <div className="space-y-2">
                      <Label className="font-semibold text-base">{t('pos.payment_dialog.enter_amount')}</Label>
                      <Input type="number" value={amount} onChange={handleAmountChange} className="w-full" />
                    </div>
                  </>
                ) : splitMethod === 'by_item' ? (
                  <>
                    <div className="space-y-2">
                      <Label className="font-semibold text-base">{t('pos.payment_dialog.assign_items_for')}</Label>
                      <div className="space-y-2">
                        {orderItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                            <Label htmlFor={`item-${item.id}`} className="flex-1 flex justify-between items-center cursor-pointer">
                              <div>
                                <span className="font-medium text-base">{item.quantity}x {item.menuItem.name}</span>
                                <p className="text-sm text-muted-foreground">${item.menuItem.price.toFixed(2)}</p>
                              </div>
                            </Label>
                            <Select
                              value={splitDetails.find(detail => detail.itemId === item.id)?.person ? String(splitDetails.find(detail => detail.itemId === item.id)?.person) : 'unassigned'}
                              onValueChange={(value) => handleAssignItem(item.id, Number(value))}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Assign..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">{t('pos.payment_dialog.unassigned_items')}</SelectItem>
                                <Separator />
                                {Array.from({ length: numPeople }, (_, i) => (
                                  <SelectItem key={i} value={String(i + 1)}>{t('pos.payment_dialog.person')} {i + 1}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label className="font-semibold text-base">{t('pos.payment_dialog.assign_items_for')}</Label>
                      <div className="space-y-2">
                        {orderItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                            <Label htmlFor={`item-${item.id}`} className="flex-1 flex justify-between items-center cursor-pointer">
                              <div>
                                <span className="font-medium text-base">{item.quantity}x {item.menuItem.name}</span>
                                <p className="text-sm text-muted-foreground">${item.menuItem.price.toFixed(2)}</p>
                              </div>
                            </Label>
                            <Input
                              type="number"
                              id={`item-${item.id}`}
                              value={bills.find(bill => bill.id === activeBillId)?.items.find(it => it.itemId === item.id)?.quantity || 0}
                              onChange={(e) => handleItemQuantityChange(item.id, Number(e.target.value))}
                              className="w-[140px]"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label className="font-semibold text-base">{t('pos.payment_dialog.bill_summary')}</Label>
                      {bills.map((bill, index) => (
                        <div key={bill.id} className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                           <div className="font-semibold text-base">
                              {t('pos.payment_dialog.bill')} {index + 1}
                          </div>
                          <div className="flex items-center gap-2">
                              <span className="font-bold text-primary text-base">${bill.amount.toFixed(2)}</span>
                              <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive/70 hover:text-destructive"
                                  onClick={(e) => { e.stopPropagation(); handleRemoveBill(bill.id); }}
                                  disabled={bills.length <= 1}
                              >
                                  <Trash2 className="h-4 w-4"/>
                              </Button>
                          </div>
                        </div>
                      ))}
                       <Button variant="outline" size="sm" onClick={handleAddBill} className="mt-2 w-full">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          {t('pos.payment_dialog.add_bill')}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
        </div>

        <DialogFooter className="p-4 pt-4 border-t !flex-row !justify-between items-center bg-background">
          <div className="text-xl font-bold">
              {t('pos.payment_dialog.total_due')}: <span className="text-primary">${totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t('dialog.cancel')}</Button>
            <Button onClick={handleConfirm} disabled={!canConfirm()}>{t('pos.payment_dialog.confirm')}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
