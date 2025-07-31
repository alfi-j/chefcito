
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useI18n } from '@/context/i18n-context';
import { type MenuItem, type Extra } from '@/lib/types';
import { MinusCircle, PlusCircle } from 'lucide-react';

interface AddItemDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: MenuItem;
  onAddItem: (item: MenuItem, quantity: number, selectedExtras: Extra[]) => void;
}

export function AddItemDialog({ isOpen, onOpenChange, item, onAddItem }: AddItemDialogProps) {
  const { t } = useI18n();
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<Extra[]>([]);

  useEffect(() => {
    // Reset state when dialog opens for a new item
    if (isOpen) {
      setQuantity(1);
      setSelectedExtras([]);
    }
  }, [isOpen, item]);
  
  const handleExtraChange = (extra: Extra, checked: boolean) => {
    setSelectedExtras(prev => 
      checked ? [...prev, extra] : prev.filter(e => e.id !== extra.id)
    );
  };

  const handleConfirm = () => {
    onAddItem(item, quantity, selectedExtras);
  };
  
  const extrasPrice = selectedExtras.reduce((acc, extra) => acc + extra.price, 0);
  const totalItemPrice = (item.price + extrasPrice) * quantity;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{item.name}</DialogTitle>
          <DialogDescription>
            {t('pos.add_item_dialog.customize')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
            {item.availableExtras && item.availableExtras.length > 0 && (
                <div className="space-y-2">
                    <Label className="font-semibold">{t('pos.add_item_dialog.extras')}</Label>
                    <div className="space-y-2">
                        {item.availableExtras.map(extra => (
                             <div key={extra.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`extra-${extra.id}`}
                                    onCheckedChange={(checked) => handleExtraChange(extra, !!checked)}
                                />
                                <label
                                    htmlFor={`extra-${extra.id}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                                >
                                    {extra.name}
                                </label>
                                <span className="text-sm text-muted-foreground">+${extra.price.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
             <div className="space-y-2">
                <Label className="font-semibold">{t('pos.add_item_dialog.quantity')}</Label>
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                    <Input className="w-16 text-center" value={quantity} readOnly />
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(q => q + 1)}>
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>

        <DialogFooter className="!flex-row !justify-between items-center">
            <div className="text-lg font-bold">
                Total: <span className="text-primary">${totalItemPrice.toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>{t('dialog.cancel')}</Button>
                <Button onClick={handleConfirm}>{t('pos.add_item_dialog.add_to_order')}</Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
