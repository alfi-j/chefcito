
"use client"
import React, { useState, useMemo, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type Category, type MenuItem } from "@/lib/types"
import { useI18n } from '@/context/i18n-context'
import { MultiSelect } from './multi-select'


export function MenuItemDialog({ 
  children, 
  item,
  onSave,
  categories
}: { 
  children: React.ReactNode, 
  item?: MenuItem,
  onSave: (item: MenuItem | Omit<MenuItem, 'id'>) => void,
  categories: Category[],
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isEditMode = !!item;
  const { t } = useI18n();

  const [name, setName] = useState('');
  const [price, setPrice] = useState<string | number>(0);
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('https://placehold.co/300x200.png');
  const [linkedModifiers, setLinkedModifiers] = useState<string[]>([]);

  const modifierGroups = useMemo(() => 
    categories
        .filter(c => c.isModifierGroup)
        .map(c => ({ value: c.name, label: c.name })), 
    [categories]
  );

  useEffect(() => {
    if(isOpen) {
      setName(item?.name || '');
      setPrice(item?.price || '');
      setCategory(item?.category || '');
      setImageUrl(item?.imageUrl || 'https://placehold.co/300x200.png');
      setLinkedModifiers(item?.linkedModifiers || []);
    }
  }, [isOpen, item]);


  const handleSubmit = () => {
    const finalPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(finalPrice)) {
      // You might want to add user feedback here, e.g., a toast notification
      return;
    }

    const itemData = {
      name,
      price: finalPrice,
      category,
      imageUrl,
      aiHint: `${name} food`,
      linkedModifiers,
    };
    if (isEditMode) {
      onSave({ id: item.id, ...itemData });
    } else {
      onSave(itemData);
    }
    setIsOpen(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{isEditMode ? t('restaurant.item_dialog.edit_title') : t('restaurant.item_dialog.add_title')}</DialogTitle>
          <DialogDescription>
            {isEditMode ? t('restaurant.item_dialog.edit_desc') : t('restaurant.item_dialog.add_desc')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">{t('restaurant.item_dialog.name')}</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">{t('restaurant.item_dialog.price')}</Label>
            <Input 
              id="price" 
              type="text" 
              inputMode="decimal"
              pattern="[0-9.]*"
              value={price} 
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*\.?\d*$/.test(value)) {
                    setPrice(value);
                }
              }} 
              className="col-span-3" 
            />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">{t('restaurant.item_dialog.category')}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={t('restaurant.item_dialog.select_category')} />
              </SelectTrigger>
              <SelectContent>
                {categories.filter(c => !c.isModifierGroup).map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="modifiers" className="text-right pt-2">{t('restaurant.item_dialog.linked_modifiers')}</Label>
            <div className="col-span-3">
               <MultiSelect
                options={modifierGroups}
                selected={linkedModifiers}
                onChange={setLinkedModifiers}
                placeholder={t('restaurant.item_dialog.select_modifiers')}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('restaurant.item_dialog.modifiers_desc')}
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>{t('dialog.cancel')}</Button>
          <Button type="submit" onClick={handleSubmit}>{isEditMode ? t('dialog.save') : t('dialog.create')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
