
"use client"
import React, { useState, useEffect, useMemo } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { type MenuItem, type Category } from "@/lib/types"
import { useI18n } from '@/context/i18n-context'
import { MultiSelect } from './multi-select'
import { ScrollArea } from '@/components/ui/scroll-area'

interface RenderedCategory extends Category {
  depth: number;
}

interface MenuItemDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item?: MenuItem;
  onSave: (item: MenuItem | Omit<MenuItem, "id">) => void;
  categories: Category[];
}

export function MenuItemDialog({
  isOpen,
  onOpenChange,
  item,
  onSave,
  categories,
}: MenuItemDialogProps) {
  const { t } = useI18n();
  const isEditMode = !!item;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string | number>('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [available, setAvailable] = useState(true);
  const [linkedModifiers, setLinkedModifiers] = useState<string[]>([]);
  
  const resetState = () => {
    setName(item?.name ?? '');
    setDescription(item?.description ?? '');
 setPrice(item?.price !== undefined ? item.price.toString() : ''); // Ensure price is string for input
 setCategory(item?.category ?? '');
    setImageUrl(item?.imageUrl || '');
    setAvailable(item?.available ?? true);
    setLinkedModifiers(item?.linkedModifiers || []);
  };

  useEffect(() => {
    if (isOpen) {
      resetState();
    }
  }, [isOpen, item]);

  const handleSubmit = () => {
    const finalPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(finalPrice)) return;

    const itemData = {
      name,
      description,
      price: finalPrice,
      category,
      imageUrl,
      available,
      linkedModifiers,
      sortIndex: 0, // Adding default sortIndex
    };

    if (isEditMode && item) {
      onSave({ id: item.id, ...itemData });
    } else {
      onSave(itemData);
    }
    onOpenChange(false);
  };
  
  const renderedCategories = useMemo(() => {
    const categoryMap = new Map(categories.map(c => [c.id, {...c, children: [] as Category[]}]));
    const roots: Category[] = [];

    categories.forEach(category => {
        if (category.parentId && categoryMap.has(category.parentId)) {
            (categoryMap.get(category.parentId) as any).children.push(category);
        } else {
            roots.push(category);
        }
    });
    
    const flattened: RenderedCategory[] = [];
    const traverse = (category: Category, depth: number) => {
        flattened.push({ ...category, depth });
        const children = (categoryMap.get(category.id) as any)?.children || [];
        children.sort((a: Category,b: Category) => a.name.localeCompare(b.name)).forEach((child: Category) => traverse(child, depth + 1));
    };

    roots.sort((a,b) => a.name.localeCompare(b.name)).forEach(root => traverse(root, 0));
    return flattened.filter(c => !c.isModifierGroup);
  }, [categories]);
  
  const modifierGroups = useMemo(() => 
    categories
        .filter(c => c.isModifierGroup)
        .map(c => ({ value: c.name, label: c.name })), 
    [categories]
  );
  
  const handleNumericInputChange = (setter: React.Dispatch<React.SetStateAction<string | number>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
        setter(value);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg flex flex-col max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="font-headline text-2xl">{isEditMode ? t('restaurant.item_dialog.edit_title') : t('restaurant.item_dialog.add_title')}</DialogTitle>
          <DialogDescription>
            {isEditMode ? t('restaurant.item_dialog.edit_desc') : t('restaurant.item_dialog.add_desc')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto">
            <ScrollArea className="h-full">
              <div className="space-y-4 p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('restaurant.item_dialog.name')}</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="price">{t('restaurant.item_dialog.price')}</Label>
                            <Input id="price" type="text" inputMode="decimal" value={price} onChange={handleNumericInputChange(setPrice)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">{t('restaurant.item_dialog.description')}</Label>
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">{t('restaurant.item_dialog.category')}</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger id="category">
                                <SelectValue placeholder={t('restaurant.item_dialog.select_category')} />
                            </SelectTrigger>
                            <SelectContent>
                                {renderedCategories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.name}>
                                        <span style={{ paddingLeft: `${cat.depth * 1.25}rem` }}>{cat.name}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="imageUrl">{t('restaurant.item_dialog.image_url')}</Label>
                        <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://placehold.co/400x400.png" />
                    </div>
                     <div className="space-y-2">
                        <Label>{t('restaurant.item_dialog.linked_modifiers')}</Label>
                        <MultiSelect
                            options={modifierGroups}
                            selected={linkedModifiers}
                            onChange={setLinkedModifiers}
                            placeholder={t('restaurant.item_dialog.select_modifiers')}
                        />
                        <p className="text-xs text-muted-foreground">
                          {t('restaurant.item_dialog.modifiers_desc')}
                        </p>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                        <Switch id="available" checked={available} onCheckedChange={setAvailable} />
                        <Label htmlFor="available">{t('restaurant.item_dialog.available')}</Label>
                    </div>
                </div>
            </ScrollArea>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 p-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('dialog.cancel')}</Button>
          <Button onClick={handleSubmit}>{isEditMode ? t('dialog.save') : t('dialog.create')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
