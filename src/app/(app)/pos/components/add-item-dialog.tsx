"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Minus, Plus, Utensils } from "lucide-react"
import { useI18n } from '@/context/i18n-context';
import { type MenuItem, type OrderItem } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

interface AddItemDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: MenuItem;
  orderItem?: OrderItem | null;
  onSave: (quantity: number, selectedExtras: MenuItem[], notes: string) => void;
  onRemove?: (itemId: string) => void;
  menuItems: MenuItem[];
  categories: any[]; // Category type
}

export function AddItemDialog({ 
  isOpen, 
  onOpenChange, 
  item,
  orderItem,
  onSave,
  onRemove,
  menuItems,
  categories
}: AddItemDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<MenuItem[]>([]);
  const [notes, setNotes] = useState('');
  const { t } = useI18n();

  // Find modifier groups that are linked to this item or its category
  const availableModifierGroups = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    
    // Find the category for this item
    const itemCategory = categories.find(c => c.name === item.category);
    
    // Get modifier IDs from item and category
    const modifierIds = [
      ...(item.linkedModifiers || []),
      ...(itemCategory?.linkedModifiers || [])
    ];
    
    // Find modifier items
    const modifiers = menuItems.filter(mi => 
      modifierIds.includes(mi.id) || 
      (mi.category && categories.find(c => c.name === mi.category)?.isModifierGroup)
    );
    
    // Group modifiers by category
    modifiers.forEach(modifier => {
      const category = categories.find(c => c.name === modifier.category);
      if (category) {
        if (!groups[category.name]) {
          groups[category.name] = [];
        }
        groups[category.name].push({
          ...modifier,
          // Ensure price is a number
          price: typeof modifier.price === 'string' ? parseFloat(modifier.price) : modifier.price
        });
      }
    });
    
    return groups;
  }, [item, categories, menuItems]);

  useEffect(() => {
    if (isOpen) {
      setQuantity(orderItem?.quantity || 1);
      setSelectedExtras(orderItem?.selectedExtras || []);
      setNotes(orderItem?.notes || '');
    }
  }, [isOpen, orderItem]);
  
  const handleExtraChange = (extra: MenuItem, checked: boolean) => {
    setSelectedExtras(prev => 
      checked ? [...prev, extra] : prev.filter(e => e.id !== extra.id)
    );
  };
  
  const isExtraSelected = (extraId: string) => {
    return selectedExtras.some(e => e.id === extraId);
  }

  const handleIncrement = () => {
    setQuantity(prev => prev + 1);
  };

  const handleDecrement = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };

  const handleConfirm = () => {
    onSave(quantity, selectedExtras, notes);
  };
  
  const handleRemove = () => {
    if (onRemove && orderItem) {
      onRemove(orderItem.id);
    }
    onOpenChange(false);
  }
  
  const extrasPrice = selectedExtras.reduce((acc, extra) => acc + (typeof extra.price === 'string' ? parseFloat(extra.price) : extra.price), 0);
  const totalItemPrice = ((typeof item.price === 'string' ? parseFloat(item.price) : item.price) + extrasPrice) * quantity;

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{item.name}</DialogTitle>
          <DialogDescription>
            {orderItem ? t('pos.add_item_dialog.update_item') : t('pos.add_item_dialog.customize')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6">
            <div className="px-4 space-y-4">
                {Object.entries(availableModifierGroups).map(([groupName, modifiers]) => {
                  if (modifiers.length === 0) return null;
                  return (
                    <div key={groupName} className="space-y-2">
                        <Label className="font-semibold text-base">{groupName}</Label>
                        <div className="space-y-2">
                            {modifiers.map(modifier => (
                                <div key={modifier.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`extra-${modifier.id}`}
                                        checked={isExtraSelected(modifier.id)}
                                        onCheckedChange={(checked) => handleExtraChange(modifier, !!checked)}
                                    />
                                    <label
                                        htmlFor={`extra-${modifier.id}`}
                                        className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                                    >
                                        {modifier.name}
                                    </label>
                                    <span className="text-base text-muted-foreground">
                                      ${(typeof modifier.price === 'string' ? parseFloat(modifier.price) : modifier.price).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                  )
                })}
                
                <Separator />

                <div className="space-y-2">
                    <Label className="font-semibold text-base" htmlFor="item-notes">{t('pos.add_item_dialog.item_notes')}</Label>
                    <Textarea id="item-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('pos.add_item_dialog.item_notes_placeholder')} />
                </div>
                
                <div className="space-y-2">
                    <Label className="font-semibold text-base">{t('pos.add_item_dialog.quantity')}</Label>
                    <div className="flex items-center justify-center space-x-2">
                        <Button variant="outline" size="icon" onClick={handleDecrement}>
                            <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
                        <Button variant="outline" size="icon" onClick={handleIncrement}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </ScrollArea>
        
        <div className="-mx-6 px-6 py-4 border-t">
            <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">{t('pos.add_item_dialog.add_to_order')}</span>
                <span className="text-xl font-bold text-primary">
                  ${totalItemPrice.toFixed(2)}
                </span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
                {orderItem && onRemove && (
                    <Button variant="destructive" onClick={handleRemove} className="flex-1">
                        {t('pos.add_item_dialog.remove')}
                    </Button>
                )}
                <Button onClick={handleConfirm} className="flex-1">
                    {orderItem ? t('pos.add_item_dialog.update') : t('pos.add_item_dialog.add')}
                </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}