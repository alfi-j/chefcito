
"use client"
import React, { useState } from 'react'
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

  const [name, setName] = useState(item?.name || '');
  const [price, setPrice] = useState(item?.price || 0);
  const [category, setCategory] = useState(item?.category || '');
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || 'https://placehold.co/300x200.png');


  const handleSubmit = () => {
    const itemData = {
      name,
      price: Number(price),
      category,
      imageUrl,
      aiHint: `${name} food`,
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
            <Input id="price" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">{t('restaurant.item_dialog.category')}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={t('restaurant.item_dialog.select_category')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
              </SelectContent>
            </Select>
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
