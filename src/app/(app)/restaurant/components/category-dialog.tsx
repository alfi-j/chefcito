
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Pencil, Trash2 } from "lucide-react"
import { type Category } from "@/lib/types"
import { useToast } from '@/hooks/use-toast'
import { useI18n } from '@/context/i18n-context'
import { addCategory, updateCategory, deleteCategory as mockDeleteCategory, isCategoryInUse } from '@/lib/mock-data';
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export function CategoryDialog({ categories, onUpdate }: { categories: Category[], onUpdate: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isNewCategoryExtra, setIsNewCategoryExtra] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { toast } = useToast();
  const { t } = useI18n();

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    try {
      addCategory(newCategoryName, isNewCategoryExtra);
      onUpdate();
      setNewCategoryName('');
      setIsNewCategoryExtra(false);
      toast({ title: t('toast.success'), description: t('restaurant.toast.category_added') });
    } catch(error: any) {
      toast({ title: t('toast.error'), description: error.message || t('restaurant.toast.add_category_error'), variant: "destructive" });
    }
  };

  const handleDeleteCategory = (id: number, name: string) => {
    try {
      if (isCategoryInUse(name)) {
        throw new Error(`Cannot delete category "${name}" because it is still in use.`);
      }
      mockDeleteCategory(id);
      onUpdate();
      toast({ title: t('toast.success'), description: t('restaurant.toast.category_deleted') });
    } catch(error: any) {
      toast({ title: t('toast.error'), description: error.message || t('restaurant.toast.delete_category_error'), variant: "destructive" });
    }
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !editingCategory.name.trim()) return;
    try {
      updateCategory(editingCategory.id, editingCategory.name, editingCategory.isExtra);
      onUpdate();
      setEditingCategory(null);
      toast({ title: t('toast.success'), description: t('restaurant.toast.category_updated') });
    } catch(error: any) {
      toast({ title: t('toast.error'), description: error.message || t('restaurant.toast.update_category_error'), variant: "destructive" });
    }
  };
  
  const startEditing = (category: Category) => {
    setEditingCategory(JSON.parse(JSON.stringify(category)));
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        setEditingCategory(null);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">{t('restaurant.menu.manage_categories')}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">{t('restaurant.category_dialog.title')}</DialogTitle>
          <DialogDescription>{t('restaurant.category_dialog.desc')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder={t('restaurant.category_dialog.new_name')}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <Button onClick={handleAddCategory}>{t('restaurant.category_dialog.add')}</Button>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="isExtraNew" checked={isNewCategoryExtra} onCheckedChange={(checked) => setIsNewCategoryExtra(!!checked)} />
              <Label htmlFor="isExtraNew" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {t('restaurant.category_dialog.is_extra')}
              </Label>
            </div>
          </div>
          <ScrollArea className="h-64 border rounded-md">
            <div className="p-2 space-y-1">
              {categories.map(category => (
                <div key={category.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                  {editingCategory?.id === category.id ? (
                    <div className='flex-1 space-y-2'>
                       <Input
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                        onBlur={handleUpdateCategory}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory()}
                        autoFocus
                        className="h-8"
                      />
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`isExtra-${category.id}`} 
                          checked={editingCategory.isExtra} 
                          onCheckedChange={(checked) => setEditingCategory({ ...editingCategory, isExtra: !!checked })}
                        />
                        <Label htmlFor={`isExtra-${category.id}`} className="text-sm font-medium">
                          {t('restaurant.category_dialog.is_extra')}
                        </Label>
                      </div>
                    </div>
                  ) : (
                    <div className='flex-1' onDoubleClick={() => startEditing(category)}>
                      <span>{category.name}</span>
                      {category.isExtra && <span className="text-xs text-muted-foreground ml-2">({t('restaurant.category_dialog.extra_category')})</span>}
                    </div>
                  )}
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditing(category)}>
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
