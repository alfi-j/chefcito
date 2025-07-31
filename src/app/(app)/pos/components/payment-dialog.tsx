
"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useI18n } from '@/context/i18n-context';
import { CreditCard, DollarSign, Users, PlusCircle, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';


interface PaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  onConfirmPayment: () => void;
}

export function PaymentDialog({ isOpen, onOpenChange, totalAmount, onConfirmPayment }: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [splits, setSplits] = useState<Array<{id: number, amount: string}>>([]);
  const { t } = useI18n();
  
  const totalPaid = splits.reduce((acc, split) => acc + (parseFloat(split.amount) || 0), 0);
  const remainingBalance = totalAmount - totalPaid;
  const canConfirm = Math.abs(remainingBalance) < 0.001 && totalPaid > 0;

  useEffect(() => {
    if (isOpen) {
      setSplits([{ id: Date.now(), amount: totalAmount.toFixed(2) }]);
      setPaymentMethod('card');
    }
  }, [isOpen, totalAmount]);

  const handleSplitChange = (id: number, value: string) => {
    // Allow only numbers and a single decimal point
    if (/^\d*\.?\d{0,2}$/.test(value)) {
        setSplits(currentSplits => 
            currentSplits.map(split => split.id === id ? { ...split, amount: value } : split)
        );
    }
  };
  
  const addSplit = () => {
    const newId = Date.now();
    const amountToPre-fill = remainingBalance > 0 ? remainingBalance.toFixed(2) : "0.00"
    setSplits(currentSplits => [...currentSplits, { id: newId, amount: amountToPre-fill }]);
  }
  
  const removeSplit = (id: number) => {
    setSplits(currentSplits => currentSplits.filter(split => split.id !== id));
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{t('pos.payment_dialog.title')}</DialogTitle>
          <DialogDescription>
            {t('pos.payment_dialog.total_due')}: 
            <span className="font-bold text-primary ml-2 text-lg">${totalAmount.toFixed(2)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-4">
          <div>
            <Label className="font-semibold">{t('pos.payment_dialog.method')}</Label>
            <RadioGroup 
              defaultValue="card" 
              className="mt-2 grid grid-cols-2 gap-4"
              onValueChange={setPaymentMethod}
              value={paymentMethod}
            >
              <div>
                <RadioGroupItem value="card" id="card" className="peer sr-only" />
                <Label
                  htmlFor="card"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <CreditCard className="mb-3 h-6 w-6" />
                  {t('pos.payment_dialog.card')}
                </Label>
              </div>
              <div>
                <RadioGroupItem value="cash" id="cash" className="peer sr-only" />
                <Label
                  htmlFor="cash"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                   <DollarSign className="mb-3 h-6 w-6" />
                  {t('pos.payment_dialog.cash')}
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <Separator />

          <div className="space-y-3">
            <div className="flex justify-between items-center">
                <Label htmlFor="split-bill" className="font-semibold flex items-center gap-2"><Users className="h-5 w-5"/>{t('pos.payment_dialog.split_bill')}</Label>
                <div className={cn(
                    "text-lg font-bold",
                    remainingBalance > 0 && "text-destructive",
                    remainingBalance < 0 && "text-yellow-500",
                    canConfirm && "text-green-600"
                )}>
                    {t('pos.payment_dialog.remaining_balance')}: ${remainingBalance.toFixed(2)}
                </div>
            </div>
             <ScrollArea className="h-40 w-full pr-4">
                <div className="space-y-2">
                    {splits.map((split, index) => (
                        <div key={split.id} className="flex items-center gap-2">
                            <Label className="w-20">{t('pos.payment_dialog.payment')} {index + 1}</Label>
                            <Input
                                type="text"
                                value={split.amount}
                                onChange={(e) => handleSplitChange(split.id, e.target.value)}
                                className="text-right flex-1"
                                placeholder="0.00"
                            />
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive/80 hover:text-destructive"
                                onClick={() => removeSplit(split.id)}
                                disabled={splits.length <= 1}
                            >
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        </div>
                    ))}
                </div>
            </ScrollArea>
            <Button variant="outline" size="sm" onClick={addSplit} disabled={remainingBalance <= 0}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('pos.payment_dialog.add_payment')}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('dialog.cancel')}</Button>
          <Button onClick={onConfirmPayment} disabled={!canConfirm}>{t('pos.payment_dialog.confirm')} ${totalAmount.toFixed(2)}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
