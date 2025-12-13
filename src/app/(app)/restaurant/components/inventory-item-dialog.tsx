"use client"
import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type InventoryItem, type MenuItem } from "@/lib/types"
import { useI18nStore } from '@/lib/stores/i18n-store'
import { MultiSelect } from './multi-select'
import { ScrollArea } from '@/components/ui/scroll-area'

export function InventoryItemDialog({ 
  item,
  onSave,
  isOpen,
  onOpenChange,
  menuItems,
}: { 
  item?: InventoryItem,
  onSave: (item: InventoryItem | Omit<InventoryItem, 'id' | 'lastRestocked'>) => void,
  isOpen: boolean,
  onOpenChange: (open: boolean) => void,
  menuItems: MenuItem[],
}) {
  const isEditMode = !!item;
  const { t } = useI18nStore();

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState<string | number>('');
  const [unit, setUnit] = useState('');
  const [reorderThreshold, setReorderThreshold] = useState<string | number>('');
  const [category, setCategory] = useState('');
  const [linkedItemIds, setLinkedItemIds] = useState<string[]>([]);
  
  const menuItemOptions = menuItems.map(mi => ({ value: mi.id, label: mi.name }));
  
  const resetState = () => {
      setName(item?.name || '');
      setQuantity(item?.quantity ?? '');
      setUnit(item?.unit || '');
      setReorderThreshold(item?.reorderThreshold ?? '');
      setCategory(item?.category || '');
      setLinkedItemIds(item?.linkedItemIds || []);
  }

  useEffect(() => {
    if(isOpen) {
      resetState();
    }
  }, [isOpen, item]);
  
  const handleSubmit = () => {
    const finalQuantity = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
    const finalReorderThreshold = typeof reorderThreshold === 'string' ? parseFloat(reorderThreshold) : reorderThreshold;

    if (isNaN(finalQuantity) || isNaN(finalReorderThreshold)) {
      // Basic validation, should be improved with form library
      return;
    }

    const itemData = {
      name,
      quantity: finalQuantity,
      unit,
      reorderThreshold: finalReorderThreshold,
      category,
      linkedItemIds,
    };
    
    if (isEditMode) {
      onSave({ 
        id: item!.id, 
        lastRestocked: item!.lastRestocked,
        ...itemData 
      });
    } else {
      onSave(itemData);
    }
    onOpenChange(false);
  };

  const handleNumericInputChange = (setter: React.Dispatch<React.SetStateAction<string | number>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
        setter(value);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="font-headline text-2xl">{isEditMode ? t('restaurant.inventory.dialog.edit_title') : t('restaurant.inventory.dialog.add_title')}</DialogTitle>
          <DialogDescription>
            {isEditMode ? t('restaurant.inventory.dialog.edit_desc') : t('restaurant.inventory.dialog.add_desc')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
            <div className="space-y-3 py-4">
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-base">{t('restaurant.inventory.dialog.name')}</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-base">{t('restaurant.inventory.dialog.quantity')}</Label>
                    <Input 
                        id="quantity" 
                        type="text"
                        inputMode="decimal"
                        value={quantity}
                        onChange={handleNumericInputChange(setQuantity)}
                    />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="unit" className="text-base">{t('restaurant.inventory.dialog.unit')}</Label>
                        <Input id="unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. kg, L, pcs"/>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="reorderThreshold" className="text-base">{t('restaurant.inventory.dialog.reorder_threshold')}</Label>
                        <Input 
                        id="reorderThreshold" 
                        type="text" 
                        inputMode="decimal"
                        value={reorderThreshold}
                        onChange={handleNumericInputChange(setReorderThreshold)}
                        />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="category" className="text-base">{t('restaurant.inventory.dialog.category')}</Label>
                    <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Dairy, Produce"/>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="linkedItems" className="text-base">{t('restaurant.inventory.dialog.linked_items')}</Label>
                    <MultiSelect
                    options={menuItemOptions}
                    selected={linkedItemIds}
                    onChange={setLinkedItemIds}
                    placeholder={t('restaurant.inventory.dialog.select_items')}
                    />
                    <p className="text-xs text-muted-foreground">
                    {t('restaurant.inventory.dialog.linked_items_desc')}
                    </p>
                </div>
            </div>
        </div>
        <DialogFooter className="pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('dialog.cancel')}</Button>
          <Button type="submit">{isEditMode ? t('dialog.save') : t('dialog.create')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}