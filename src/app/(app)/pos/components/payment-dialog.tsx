
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
import { CreditCard, DollarSign, Users } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';

interface PaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  onConfirmPayment: () => void;
}

export function PaymentDialog({ isOpen, onOpenChange, totalAmount, onConfirmPayment }: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [splitCount, setSplitCount] = useState(1);
  const { t } = useI18n();

  useEffect(() => {
    if (isOpen) {
        setSplitCount(1);
    }
  }, [isOpen]);

  const handleSplitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(e.target.value, 10);
    setSplitCount(count > 0 ? count : 1);
  }

  const amountPerPerson = totalAmount / splitCount;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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

          <div>
            <Label htmlFor="split-bill" className="font-semibold flex items-center gap-2"><Users className="h-5 w-5"/>{t('pos.payment_dialog.split_bill')}</Label>
            <div className="flex items-center gap-4 mt-2">
                <Input
                    id="split-bill"
                    type="number"
                    value={splitCount}
                    onChange={handleSplitChange}
                    className="w-24 text-center"
                    min="1"
                />
                {splitCount > 1 && (
                    <div className="text-lg font-bold">
                        <span className="text-muted-foreground">{t('pos.payment_dialog.per_person')}: </span>
                        <span className="text-primary">${amountPerPerson.toFixed(2)}</span>
                    </div>
                )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('dialog.cancel')}</Button>
          <Button onClick={onConfirmPayment}>{t('pos.payment_dialog.confirm')} ${totalAmount.toFixed(2)}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
