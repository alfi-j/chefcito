
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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

interface RenderedCategory extends Category {
  depth: number;
}

export function MenuItemDialog({ 
  children, 
  item,
  onSave,
  categories,
  onDataChange,
}: { 
  children: React.ReactNode, 
  item?: MenuItem,
  onSave: (item: MenuItem | Omit<MenuItem, 'id'>) => void,
  categories: Category[],
  onDataChange?: (data: Partial<MenuItem>) => void,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isEditMode = !!item;
  const { t } = useI18n();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [available, setAvailable] = useState(true);
  const [price, setPrice] = useState<string | number>(0);
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkedModifiers, setLinkedModifiers] = useState<string[]>([]);

  const modifierGroups = useMemo(() => 
    categories
        .filter(c => c.isModifierGroup)
        .map(c => ({ value: c.name, label: c.name })), 
    [categories]
  );
  
  const renderedCategories = useMemo(() => {
    const categoryMap = new Map(categories.map(c => [c.id, {...c, children: [] as Category[]}]));
    const roots: Category[] = [];

    categories.forEach(category => {
        if (category.parentId && categoryMap.has(category.parentId)) {
            categoryMap.get(category.parentId)!.children.push(category as any);
        } else {
            roots.push(category);
        }
    });
    
    const flattened: RenderedCategory[] = [];
    const traverse = (category: Category, depth: number) => {
        flattened.push({ ...category, depth });
        const children = categoryMap.get(category.id)?.children || [];
        children.sort((a,b) => a.name.localeCompare(b.name)).forEach(child => traverse(child, depth + 1));
    };

    roots.sort((a,b) => a.name.localeCompare(b.name)).forEach(root => traverse(root, 0));
    return flattened;
  }, [categories]);
  
  const resetState = () => {
      setName(item?.name || '');
      setDescription(item?.description || '');
      setAvailable(item?.available ?? true);
      setPrice(item?.price || '');
      setCategory(item?.category || '');
      setImageUrl(item?.imageUrl || '');
      setLinkedModifiers(item?.linkedModifiers || []);
  }

  useEffect(() => {
    if(isOpen) {
      resetState();
    }
  }, [isOpen, item]);
  
  useEffect(() => {
    if (onDataChange) {
      const liveData = {
        name,
        price,
        imageUrl,
        category,
        description,
        available
      };
      onDataChange(liveData);
    }
  }, [name, price, imageUrl, category, description, available, onDataChange]);


  const handleSubmit = () => {
    const finalPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(finalPrice)) {
      return;
    }

    const itemData = {
      name,
      description,
      available,
      price: finalPrice,
      category,
      imageUrl,
      aiHint: `${name} food`,
      linkedModifiers,
    };
    if (isEditMode) {
      onSave({ id: item!.id, ...itemData });
    } else {
      onSave(itemData);
    }
    setIsOpen(false);
  };
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
        onDataChange && onDataChange({}); // Clear preview on close
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild onClick={() => item && onDataChange?.(item)}>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
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
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2">{t('restaurant.item_dialog.description')}</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
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
                {renderedCategories.map(cat => <SelectItem key={cat.id} value={cat.name}><span style={{ paddingLeft: `${cat.depth * 1.25}rem` }}>{cat.name}</span></SelectItem>)}
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
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="available" className="text-right">{t('restaurant.item_dialog.available')}</Label>
            <Switch id="available" checked={available} onCheckedChange={setAvailable} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>{t('dialog.cancel')}</Button>
          <Button type="submit" onClick={handleSubmit}>{isEditMode ? t('dialog.save') : t('dialog.create')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    