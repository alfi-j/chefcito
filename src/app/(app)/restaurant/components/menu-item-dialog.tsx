"use client"

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from "sonner";
import { useI18nStore } from '@/lib/stores/i18n-store'
import { type MenuItem, type Category } from "@/lib/types"
import { MultiSelect } from './multi-select'

interface MenuItemDialogProps {
  item?: MenuItem;
  categories: Category[];
  onSave: (item: MenuItem | Omit<MenuItem, "id">) => void;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function MenuItemDialog({ item, categories, onSave, trigger, isOpen, onOpenChange }: MenuItemDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [name, setName] = useState(item?.name || '');
  const [price, setPrice] = useState(item?.price?.toString() || '');
  const [description, setDescription] = useState(item?.description || '');
  const [category, setCategory] = useState(item?.category || '');
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || '');
  const [aiHint, setAiHint] = useState(item?.aiHint || '');
  const [linkedModifiers, setLinkedModifiers] = useState<string[]>(item?.linkedModifiers || []);
  const { t } = useI18nStore();
  
  // Use external open state if provided, otherwise use internal state
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  
  const modifierGroups = categories
    .filter(c => c.isModifierGroup)
    .map(c => ({ value: c.name, label: c.name }));

  const resetForm = () => {
    setName(item?.name || '');
    setPrice(item?.price?.toString() || '');
    setDescription(item?.description || '');
    setCategory(item?.category || '');
    setImageUrl(item?.imageUrl || '');
    setAiHint(item?.aiHint || '');
    setLinkedModifiers(item?.linkedModifiers || []);
  };

  // Reset form when item changes
  useEffect(() => {
    resetForm();
  }, [item]);

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    // Only reset the form when opening the dialog, not when closing it
    if (open && !item) {
      resetForm();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !price || !category) {
      toast.error(t('toast.error'), { description: t('restaurant.menu_item_dialog.validation_error'), duration: 3000 });
      return;
    }

    try {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        toast.error(t('toast.error'), { description: t('restaurant.menu_item_dialog.invalid_price'), duration: 3000 });
        return;
      }

      if (item?.id) {
        // Update existing item
        await onSave({
          id: item.id,
          name: name.trim(),
          price: priceNum,
          description: description.trim() || undefined,
          category,
          imageUrl: imageUrl.trim() || '',
          aiHint: aiHint.trim() || undefined,
          linkedModifiers: linkedModifiers.length > 0 ? linkedModifiers : undefined,
          sortIndex: 0,
          available: item.available
        });
      } else {
        // Add new item
        await onSave({
          name: name.trim(),
          price: priceNum,
          description: description.trim() || undefined,
          category,
          imageUrl: imageUrl.trim() || '',
          aiHint: aiHint.trim() || undefined,
          linkedModifiers: linkedModifiers.length > 0 ? linkedModifiers : undefined,
          sortIndex: 0
        });
      }

      handleOpenChange(false);
      // toast.success(t('toast.success'), { description: item ? t('restaurant.menu_item_dialog.updated') : t('restaurant.menu_item_dialog.added'), duration: 3000 });
    } catch (error: any) {
      // toast.error(t('toast.error'), { description: error.message || t('restaurant.menu_item_dialog.error'), duration: 3000 });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="font-headline">
            {item ? t('restaurant.menu_item_dialog.edit_title') : t('restaurant.menu_item_dialog.add_title')}
          </DialogTitle>
          <DialogDescription>
            {item ? t('restaurant.menu_item_dialog.edit_desc') : t('restaurant.menu_item_dialog.add_desc')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-2 -mx-6 px-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium leading-none">
                {t('restaurant.menu_item_dialog.name')}
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('restaurant.menu_item_dialog.name_placeholder')}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="price" className="text-sm font-medium leading-none">
                {t('restaurant.menu_item_dialog.price')}
              </label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={t('restaurant.menu_item_dialog.price_placeholder')}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium leading-none">
                {t('restaurant.menu_item_dialog.description')}
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('restaurant.menu_item_dialog.description_placeholder')}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium leading-none">
                {t('restaurant.menu_item_dialog.category')}
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder={t('restaurant.menu_item_dialog.category_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter(c => !c.isModifierGroup)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="imageUrl" className="text-sm font-medium leading-none">
                {t('restaurant.menu_item_dialog.image_url')}
              </label>
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder={t('restaurant.menu_item_dialog.image_url_placeholder')}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="aiHint" className="text-sm font-medium leading-none">
                {t('restaurant.menu_item_dialog.ai_hint')}
              </label>
              <Textarea
                id="aiHint"
                value={aiHint}
                onChange={(e) => setAiHint(e.target.value)}
                placeholder={t('restaurant.menu_item_dialog.ai_hint_placeholder')}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                {t('restaurant.menu_item_dialog.linked_modifiers')}
              </label>
              <MultiSelect
                options={modifierGroups}
                selected={linkedModifiers}
                onChange={setLinkedModifiers}
              />
            </div>
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" type="button" onClick={() => handleOpenChange(false)}>
              {t('dialog.cancel')}
            </Button>
            <Button type="submit">
              {item ? t('dialog.save') : t('dialog.add')}
            </Button>
          </DialogFooter>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}