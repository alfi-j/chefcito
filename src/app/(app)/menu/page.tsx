
"use client"
import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, PlusCircle, Pencil, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useI18n } from '@/context/i18n-context'

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useI18n();

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, catsRes] = await Promise.all([
        fetch('/api/menu'),
        fetch('/api/categories')
      ]);
      if (!itemsRes.ok || !catsRes.ok) {
          throw new Error('Failed to fetch menu data');
      }
      const items = await itemsRes.json();
      const cats = await catsRes.json();
      setMenuItems(items);
      setCategories(cats);
    } catch (error) {
       console.error("Failed to fetch menu data:", error);
       toast({ title: t('toast.error'), description: t('menu.toast.fetch_error'), variant: "destructive" });
    } finally {
        setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleSaveItem = async (itemData: MenuItem | Omit<MenuItem, 'id'>) => {
    const isEditMode = 'id' in itemData;
    const method = isEditMode ? 'PUT' : 'POST';
    const res = await fetch('/api/menu', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData),
    });

    if (res.ok) {
      await fetchAllData();
      toast({ title: t('toast.success'), description: t(isEditMode ? 'menu.toast.item_updated' : 'menu.toast.item_added') });
    } else {
      const { error } = await res.json();
      toast({ title: t('toast.error'), description: error || t(isEditMode ? 'menu.toast.update_item_error' : 'menu.toast.add_item_error'), variant: "destructive" });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const res = await fetch('/api/menu', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId }),
    });
    if (res.ok) {
      await fetchAllData();
      toast({ title: t('toast.success'), description: t('menu.toast.item_deleted') });
    } else {
       const { error } = await res.json();
       toast({ title: t('toast.error'), description: error || t('menu.toast.delete_item_error'), variant: "destructive" });
    }
  };
  
  const handleCategoriesUpdate = async () => {
    await fetchAllData();
  }

  if (loading) {
    return (
        <div className="flex justify-center items-center h-full">
            <p>{t('menu.loading')}</p>
        </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="font-headline text-2xl">{t('menu.title')}</CardTitle>
          <div className="flex gap-2">
            <CategoryDialog categories={categories} onUpdate={handleCategoriesUpdate} />
            <MenuItemDialog onSave={handleSaveItem} categories={categories}>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('menu.add_item')}
              </Button>
            </MenuItemDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  {t('menu.table.image')}
                </TableHead>
                <TableHead>{t('menu.table.name')}</TableHead>
                <TableHead>{t('menu.table.category')}</TableHead>
                <TableHead className="text-right">{t('menu.table.price')}</TableHead>
                <TableHead>
                  <span className="sr-only">{t('menu.table.actions')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menuItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt={item.name}
                      className="aspect-square rounded-md object-cover"
                      height="64"
                      src={item.imageUrl || 'https://placehold.co/64x64.png'}
                      width="64"
                      data-ai-hint={item.aiHint}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">${item.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">{t('menu.table.toggle_menu')}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t('menu.table.actions')}</DropdownMenuLabel>
                           <MenuItemDialog item={item} onSave={handleSaveItem} categories={categories}>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>{t('menu.table.edit')}</DropdownMenuItem>
                          </MenuItemDialog>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteItem(item.id)}>{t('menu.table.delete')}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function MenuItemDialog({ 
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
          <DialogTitle className="font-headline">{isEditMode ? t('menu.item_dialog.edit_title') : t('menu.item_dialog.add_title')}</DialogTitle>
          <DialogDescription>
            {isEditMode ? t('menu.item_dialog.edit_desc') : t('menu.item_dialog.add_desc')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">{t('menu.item_dialog.name')}</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">{t('menu.item_dialog.price')}</Label>
            <Input id="price" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">{t('menu.item_dialog.category')}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={t('menu.item_dialog.select_category')} />
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


function CategoryDialog({ categories, onUpdate }: { categories: Category[], onUpdate: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { toast } = useToast();
  const { t } = useI18n();

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategoryName }),
    });

    if (res.ok) {
      onUpdate();
      setNewCategoryName('');
      toast({ title: t('toast.success'), description: t('menu.toast.category_added') });
    } else {
      const { error } = await res.json();
      toast({ title: t('toast.error'), description: error || t('menu.toast.add_category_error'), variant: "destructive" });
    }
  };

  const handleDeleteCategory = async (id: number, name: string) => {
    const res = await fetch('/api/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name }),
    });

    if (res.ok) {
      onUpdate();
      toast({ title: t('toast.success'), description: t('menu.toast.category_deleted') });
    } else {
      const { error } = await res.json();
      toast({ title: t('toast.error'), description: error || t('menu.toast.delete_category_error'), variant: "destructive" });
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return;
    
    const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingCategory.id, name: editingCategory.name }),
    });
    
    if (res.ok) {
      onUpdate();
      setEditingCategory(null);
      toast({ title: t('toast.success'), description: t('menu.toast.category_updated') });
    } else {
      const { error } = await res.json();
      toast({ title: t('toast.error'), description: error || t('menu.toast.update_category_error'), variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        setEditingCategory(null);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">{t('menu.manage_categories')}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">{t('menu.category_dialog.title')}</DialogTitle>
          <DialogDescription>{t('menu.category_dialog.desc')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder={t('menu.category_dialog.new_name')}
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <Button onClick={handleAddCategory}>{t('menu.category_dialog.add')}</Button>
          </div>
          <ScrollArea className="h-64 border rounded-md">
            <div className="p-2 space-y-1">
              {categories.map(category => (
                <div key={category.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                  {editingCategory?.id === category.id ? (
                    <Input
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                      onBlur={handleUpdateCategory}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory()}
                      autoFocus
                      className="h-8"
                    />
                  ) : (
                    <span className="flex-1" onDoubleClick={() => setEditingCategory(category)}>{category.name}</span>
                  )}
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingCategory(category)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/80 hover:text-destructive" onClick={() => handleDeleteCategory(category.id, category.name)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>{t('dialog.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
