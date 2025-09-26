<<<<<<< HEAD
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
=======

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
import { type MenuItem, type Category, type OrderItem } from '@/lib/types';
import { MinusCircle, PlusCircle, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
>>>>>>> d3399ff (Chefcito Beta!)

interface AddItemDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: MenuItem;
  orderItem?: OrderItem | null;
  onSave: (quantity: number, selectedExtras: MenuItem[], notes: string) => void;
  onRemove?: (itemId: string) => void;
  menuItems: MenuItem[];
<<<<<<< HEAD
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
    
=======
  categories: Category[];
}

export function AddItemDialog({ isOpen, onOpenChange, item, orderItem, onSave, onRemove, menuItems, categories }: AddItemDialogProps) {
  const { t } = useI18n();
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<MenuItem[]>([]);
  const [notes, setNotes] = useState('');
  
  const isEditMode = !!orderItem;

  const availableModifierGroups = useMemo(() => {
    if (!item) return {};

    const categoryMap = new Map(categories.map(c => [c.name, c]));
    
    const getParentModifiers = (categoryName: string): string[] => {
        const category = categoryMap.get(categoryName);
        if (!category) return [];

        const ownModifiers = category.linkedModifiers || [];
        
        const parentCategory = categories.find(c => c.id === category.parentId);
        if (parentCategory) {
            return [...ownModifiers, ...getParentModifiers(parentCategory.name)];
        }
        
        return ownModifiers;
    }

    const itemCategory = categories.find(c => c.name === item.category);
    
    const allInheritedModifiers = itemCategory ? getParentModifiers(itemCategory.name) : [];

    const modifierCategoryNames = new Set([
      ...(item.linkedModifiers || []),
      ...allInheritedModifiers
    ]);

    const groups: Record<string, MenuItem[]> = {};
    
    modifierCategoryNames.forEach(catName => {
        const category = categoryMap.get(catName);
        if (category && category.isModifierGroup) {
            groups[catName] = menuItems.filter(i => i.category === catName);
        }
    });

>>>>>>> d3399ff (Chefcito Beta!)
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

<<<<<<< HEAD
  const handleIncrement = () => {
    setQuantity(prev => prev + 1);
  };

  const handleDecrement = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };

=======
>>>>>>> d3399ff (Chefcito Beta!)
  const handleConfirm = () => {
    onSave(quantity, selectedExtras, notes);
  };
  
  const handleRemove = () => {
    if (onRemove && orderItem) {
      onRemove(orderItem.id);
    }
    onOpenChange(false);
  }
  
<<<<<<< HEAD
  const extrasPrice = selectedExtras.reduce((acc, extra) => acc + (typeof extra.price === 'string' ? parseFloat(extra.price) : extra.price), 0);
  const totalItemPrice = ((typeof item.price === 'string' ? parseFloat(item.price) : item.price) + extrasPrice) * quantity;
=======
  const extrasPrice = selectedExtras.reduce((acc, extra) => acc + extra.price, 0);
  const totalItemPrice = (item.price + extrasPrice) * quantity;
>>>>>>> d3399ff (Chefcito Beta!)

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{item.name}</DialogTitle>
          <DialogDescription>
<<<<<<< HEAD
            {orderItem ? t('pos.add_item_dialog.update_item') : t('pos.add_item_dialog.customize')}
=======
            {isEditMode ? t('pos.add_item_dialog.update_item') : t('pos.add_item_dialog.customize')}
>>>>>>> d3399ff (Chefcito Beta!)
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
<<<<<<< HEAD
                                      ${(typeof modifier.price === 'string' ? parseFloat(modifier.price) : modifier.price).toFixed(2)}
=======
                                        +${
                                            typeof modifier.price === 'string' 
                                            ? parseFloat(modifier.price).toFixed(2) 
                                            : modifier.price.toFixed(2)
                                        }
>>>>>>> d3399ff (Chefcito Beta!)
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
<<<<<<< HEAD
                    <div className="flex items-center justify-center space-x-2">
                        <Button variant="outline" size="icon" onClick={handleDecrement}>
                            <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
                        <Button variant="outline" size="icon" onClick={handleIncrement}>
                            <Plus className="h-4 w-4" />
=======
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <Input className="w-16 text-center text-base" value={quantity} readOnly />
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(q => q + 1)}>
                          <PlusCircle className="h-4 w-4" />
>>>>>>> d3399ff (Chefcito Beta!)
                        </Button>
                    </div>
                </div>
            </div>
        </ScrollArea>
<<<<<<< HEAD
        
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
=======

        <DialogFooter className="!flex-row !justify-between items-center pt-4 border-t">
            <div className="flex items-center gap-2">
                 {isEditMode && onRemove && (
                    <Button variant="destructive" size="icon" onClick={handleRemove}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">{t('pos.add_item_dialog.remove_item')}</span>
                    </Button>
                 )}
                 <div className="text-xl font-bold">
                    Total: <span className="text-primary">${totalItemPrice.toFixed(2)}</span>
                </div>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>{t('dialog.cancel')}</Button>
                <Button onClick={handleConfirm}>{isEditMode ? t('dialog.save') : t('pos.add_item_dialog.add_to_order')}</Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
>>>>>>> d3399ff (Chefcito Beta!)
