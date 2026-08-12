"use client"
import React, { useEffect } from 'react'
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
import { useTranslation } from 'react-i18next'
import { useInventoryStore } from '@/lib/stores/inventory-store'
import { MultiSelect } from './multi-select'

export function InventoryItemDialog({ 
  item,
  onSave,
  isOpen,
  onOpenChange,
  menuItems,
}: { 
  item?: InventoryItem,
  onSave: (item: Omit<InventoryItem, 'restaurantId'> | Omit<Omit<InventoryItem, 'restaurantId'>, 'id' | 'lastRestocked'>) => void,
  isOpen: boolean,
  onOpenChange: (open: boolean) => void,
  menuItems: MenuItem[],
}) {
  const isEditMode = !!item;
  const { t } = useTranslation();
  
  // Form state from store
  const formName = useInventoryStore((state) => state.form.name);
  const formQuantity = useInventoryStore((state) => state.form.quantity);
  const formUnit = useInventoryStore((state) => state.form.unit);
  const formReorderThreshold = useInventoryStore((state) => state.form.reorderThreshold);
  const formCategory = useInventoryStore((state) => state.form.category);
  const formLinkedItemIds = useInventoryStore((state) => state.form.linkedItemIds);
  const resetForm = useInventoryStore((state) => state.resetForm);
  const clearForm = useInventoryStore((state) => state.clearForm);
  const getFormErrors = useInventoryStore((state) => state.getFormErrors);
  const setFormName = useInventoryStore((state) => state.setFormName);
  const setFormQuantity = useInventoryStore((state) => state.setFormQuantity);
  const setFormUnit = useInventoryStore((state) => state.setFormUnit);
  const setFormReorderThreshold = useInventoryStore((state) => state.setFormReorderThreshold);
  const setFormCategory = useInventoryStore((state) => state.setFormCategory);
  const setFormLinkedItemIds = useInventoryStore((state) => state.setFormLinkedItemIds);
  
  const menuItemOptions = menuItems.map(mi => ({ value: mi.id, label: mi.name }));
  
  // Reset form when dialog opens/closes or item changes
  useEffect(() => {
    if (isOpen) {
      resetForm(item);
    } else {
      clearForm();
    }
  }, [isOpen, item, resetForm, clearForm]);
  
  const handleSubmit = () => {
    // Validation using store validation
    const errors = getFormErrors();
    if (errors.length > 0) {
      // Handle validation errors
      return;
    }

    const finalQuantity = parseFloat(formQuantity);
    const finalReorderThreshold = parseFloat(formReorderThreshold);

    const itemData = {
      name: formName,
      quantity: finalQuantity,
      unit: formUnit,
      reorderThreshold: finalReorderThreshold,
      category: formCategory,
      linkedItemIds: formLinkedItemIds,
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
    clearForm();
    onOpenChange(false);
  };

  const handleNumericInputChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
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
                    <Input id="name" value={formName} onChange={(e) => setFormName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-base">{t('restaurant.inventory.dialog.quantity')}</Label>
                    <Input 
                        id="quantity" 
                        type="text"
                        inputMode="decimal"
                        value={formQuantity}
                        onChange={handleNumericInputChange(setFormQuantity)}
                    />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="unit" className="text-base">{t('restaurant.inventory.dialog.unit')}</Label>
                        <Input id="unit" value={formUnit} onChange={(e) => setFormUnit(e.target.value)} placeholder="e.g. kg, L, pcs"/>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="reorderThreshold" className="text-base">{t('restaurant.inventory.dialog.reorder_threshold')}</Label>
                        <Input 
                        id="reorderThreshold" 
                        type="text" 
                        inputMode="decimal"
                        value={formReorderThreshold}
                        onChange={handleNumericInputChange(setFormReorderThreshold)}
                        />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="category" className="text-base">{t('restaurant.inventory.dialog.category')}</Label>
                    <Input id="category" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} placeholder="e.g. Dairy, Produce"/>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="linkedItems" className="text-base">{t('restaurant.inventory.dialog.linked_items')}</Label>
                    <MultiSelect
                    options={menuItemOptions}
                    selected={formLinkedItemIds}
                    onChange={(values) => {
                                          // Handle both direct values and function updaters
                                          const actualValues = typeof values === 'function' 
                                            ? values(formLinkedItemIds)
                                            : values;
                                          setFormLinkedItemIds(actualValues);
                                        }}
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
          <Button type="button" onClick={handleSubmit}>{isEditMode ? t('dialog.save') : t('dialog.create')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}