
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useI18n } from '@/context/i18n-context';
import { type MenuItem, type Category } from '@/lib/types';
import { MinusCircle, PlusCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface AddItemDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: MenuItem;
  onAddItem: (item: MenuItem, quantity: number, selectedExtras: MenuItem[]) => void;
  menuItems: MenuItem[];
  categories: Category[];
}

export function AddItemDialog({ isOpen, onOpenChange, item, onAddItem, menuItems, categories }: AddItemDialogProps) {
  const { t } = useI18n();
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<MenuItem[]>([]);
  
  const availableModifierGroups = useMemo(() => {
    if (!item) return {};

    const itemCategory = categories.find(c => c.name === item.category);
    const modifierCategoryNames = new Set([
      ...(item.linkedModifiers || []),
      ...(itemCategory?.linkedModifiers || [])
    ]);

    const groups: Record<string, MenuItem[]> = {};
    
    modifierCategoryNames.forEach(catName => {
        groups[catName] = menuItems.filter(i => i.category === catName);
    });

    return groups;
  }, [item, categories, menuItems]);

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSelectedExtras([]);
    }
  }, [isOpen]);
  
  const handleExtraChange = (extra: MenuItem, checked: boolean) => {
    setSelectedExtras(prev => 
      checked ? [...prev, extra] : prev.filter(e => e.id !== extra.id)
    );
  };

  const handleConfirm = () => {
    onAddItem(item, quantity, selectedExtras);
  };
  
  const extrasPrice = selectedExtras.reduce((acc, extra) => acc + extra.price, 0);
  const totalItemPrice = (item.price + extrasPrice) * quantity;

  if (!item) return null;

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
            {Object.entries(availableModifierGroups).map(([groupName, modifiers]) => (
                <div key={groupName} className="space-y-2">
                    <Label className="font-semibold">{groupName}</Label>
                    <div className="space-y-2">
                        {modifiers.map(modifier => (
                             <div key={modifier.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`extra-${modifier.id}`}
                                    onCheckedChange={(checked) => handleExtraChange(modifier, !!checked)}
                                />
                                <label
                                    htmlFor={`extra-${modifier.id}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                                >
                                    {modifier.name}
                                </label>
                                <span className="text-sm text-muted-foreground">+${modifier.price.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            
            <Separator />
            
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
