
"use client"
import React, { useState, useMemo, useEffect } from 'react'
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
import { type Category, type MenuItem } from "@/lib/types"
import { useI18n } from '@/context/i18n-context'
import { MultiSelect } from './multi-select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'

interface RenderedCategory extends Category {
  depth: number;
}

export function MenuItemDialog({ 
  item,
  onSave,
  categories,
  isOpen,
  onOpenChange,
}: { 
  item?: MenuItem,
  onSave: (item: MenuItem | Omit<MenuItem, 'id'>) => void,
  categories: Category[],
  isOpen: boolean,
  onOpenChange: (open: boolean) => void,
}) {
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
      onSave({ id: item!.id, ...itemData, sortIndex: item.sortIndex });
    } else {
      onSave(itemData);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{isEditMode ? t('restaurant.item_dialog.edit_title') : t('restaurant.item_dialog.add_title')}</DialogTitle>
          <DialogDescription>
            {isEditMode ? t('restaurant.item_dialog.edit_desc') : t('restaurant.item_dialog.add_desc')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
              <div className="px-1 py-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t('restaurant.item_dialog.name')}</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="price">{t('restaurant.item_dialog.price')}</Label>
                        <Input 
                            id="price" 
                            type="text" 
                            inputMode="decimal"
                            pattern="[0-9.]*"
                            value={price} 
                            onChange={(e) => {
                            const value = e.target.value;
                            if (/^\\d*\\.?\\d*$/.test(value)) {
                                setPrice(value);
                            }
                            }} 
                        />
                    </div>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="description">{t('restaurant.item_dialog.description')}</Label>
                      <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="category">{t('restaurant.item_dialog.category')}</Label>
                      <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger>
                          <SelectValue placeholder={t('restaurant.item_dialog.select_category')} />
                          </SelectTrigger>
                          <SelectContent>
                          {renderedCategories.filter(c => !c.isModifierGroup).map(cat => <SelectItem key={cat.id} value={cat.name}><span style={{ paddingLeft: `${cat.depth * 1.25}rem` }}>{cat.name}</span></SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="modifiers">{t('restaurant.item_dialog.linked_modifiers')}</Label>
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
                   <div className="space-y-2">
                      <Label htmlFor="imageUrl">{t('restaurant.item_dialog.image_url')}</Label>
                      <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                      <Switch id="available" checked={available} onCheckedChange={setAvailable} />
                      <Label htmlFor="available">{t('restaurant.item_dialog.available')}</Label>
                  </div>
              </div>
          </ScrollArea>
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('dialog.cancel')}</Button>
          <Button type="submit" onClick={handleSubmit}>{isEditMode ? t('dialog.save') : t('dialog.create')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
