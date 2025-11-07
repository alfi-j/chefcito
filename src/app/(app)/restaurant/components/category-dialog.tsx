
"use client"
import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from '@/components/ui/scroll-area'
import { Pencil, Trash2, Check } from "lucide-react"
import { type Category } from "@/lib/types"
import { toast } from "sonner";
import { useI18nStore } from '@/lib/stores/i18n-store'
import { useMenuStore } from '@/lib/stores/menu-store'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { MultiSelect } from './multi-select'

interface RenderedCategory extends Category {
  depth: number;
}

export function CategoryDialog({ categories, onUpdate, trigger }: { categories: Category[], onUpdate: (category: Omit<Category, "id">) => void, trigger: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isNewCategoryModifier, setIsNewCategoryModifier] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { t } = useI18nStore();
  const { addCategory, updateCategory, deleteCategory, isCategoryInUse } = useMenuStore();
  
  const modifierGroups = useMemo(() => 
    categories
        .filter(c => c.isModifierGroup)
        .map(c => ({ value: c.name, label: c.name })), 
    [categories]
  );

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await addCategory({
        name: newCategoryName, 
        isModifierGroup: isNewCategoryModifier
      });
      onUpdate({ name: newCategoryName, isModifierGroup: isNewCategoryModifier });
      setNewCategoryName('');
      setIsNewCategoryModifier(false);
      toast.success(t('toast.success'), { description: t('restaurant.toast.category_added'), duration: 3000 });
    } catch(error: any) {
      toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.add_category_error'), duration: 3000 });
    }
  };

  const handleDeleteCategory = async (id: number, name: string) => {
    try {
      if (await isCategoryInUse(id)) {
        throw new Error(`Cannot delete category "${name}" because it is still in use.`);
      }
      await deleteCategory(id);
      onUpdate({ name, isModifierGroup: false }); // We don't have the actual category data, so we're just passing a placeholder
      toast.success(t('toast.success'), { description: t('restaurant.toast.category_deleted'), duration: 3000 });
    } catch(error: any) {
      toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.delete_category_error'), duration: 3000 });
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return;
    try {
      await updateCategory(editingCategory.id, editingCategory);
      onUpdate({ name: editingCategory.name, isModifierGroup: editingCategory.isModifierGroup || false });
      setEditingCategory(null);
      toast.success(t('toast.success'), { description: t('restaurant.toast.category_updated'), duration: 3000 });
    } catch(error: any) {
      toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.update_category_error'), duration: 3000 });
    }
  };
  
  const startEditing = (category: Category) => {
    if (editingCategory) {
      handleUpdateCategory();
    }
    setEditingCategory(JSON.parse(JSON.stringify(category)));
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      if (editingCategory) {
        handleUpdateCategory();
      }
      setEditingCategory(null);
    }
  };
  
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

  const parentCategoryOptions = useMemo(() => {
    return renderedCategories.filter(c => c.id !== editingCategory?.id);
  }, [renderedCategories, editingCategory]);


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
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
              <Checkbox id="isModifierNew" checked={isNewCategoryModifier} onCheckedChange={(checked) => setIsNewCategoryModifier(!!checked)} />
              <Label htmlFor="isModifierNew" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {t('restaurant.category_dialog.is_modifier')}
              </Label>
            </div>
          </div>
          <ScrollArea className="h-64 border rounded-md">
            <div className="p-2 space-y-1">
              {renderedCategories.map(category => (
                <div key={category.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                  {editingCategory?.id === category.id ? (
                    <div className='flex-1 space-y-2'>
                       <Input
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                        onKeyDown={(e) => { if (e.key === 'Enter') { handleUpdateCategory(); e.preventDefault(); e.stopPropagation(); } }}
                        autoFocus
                        className="h-8"
                      />
                      <div className="grid grid-cols-2 gap-2">
                         <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={`isModifier-${category.id}`} 
                              checked={editingCategory.isModifierGroup} 
                              onCheckedChange={(checked) => setEditingCategory({ ...editingCategory, isModifierGroup: !!checked })}
                            />
                            <Label htmlFor={`isModifier-${category.id}`} className="text-sm font-medium">
                              {t('restaurant.category_dialog.is_modifier')}
                            </Label>
                        </div>
                      </div>

                       {!editingCategory.isModifierGroup && (
                        <div>
                          <Label className="text-sm font-medium">{t('restaurant.category_dialog.parent_category')}</Label>
                          <Select
                            value={String(editingCategory.parentId || 'null')}
                            onValueChange={(value) => {
                               if(editingCategory) {
                                  setEditingCategory({...editingCategory, parentId: value === 'null' ? null : Number(value)})
                               }
                            }}
                          >
                             <SelectTrigger className="mt-1 h-8">
                                <SelectValue placeholder={t('restaurant.category_dialog.select_parent')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="null">{t('restaurant.category_dialog.no_parent')}</SelectItem>
                                {parentCategoryOptions.map(opt => (
                                    <SelectItem key={opt.id} value={String(opt.id)}>
                                        <span style={{ paddingLeft: `${opt.depth * 1.25}rem` }}>{opt.name}</span>
                                    </SelectItem>
                                ))}
                              </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      {!editingCategory.isModifierGroup && (
                        <div>
                          <Label className="text-sm font-medium">{t('restaurant.category_dialog.linked_modifiers')}</Label>
                          <MultiSelect
                            options={modifierGroups}
                            selected={editingCategory.linkedModifiers || []}
                            onChange={(selected) => {
                               if (editingCategory) {
                                setEditingCategory({
                                  ...editingCategory, 
                                  linkedModifiers: Array.isArray(selected) ? selected : []
                                })
                               }
                            }}
                            className="mt-1"
                          />

                        </div>
                      )}
                    </div>
                  ) : (
                    <div className='flex-1' onDoubleClick={() => startEditing(category)} style={{ paddingLeft: `${category.depth * 1.25}rem` }}>
                      <span>{category.name}</span>
                      {category.isModifierGroup && <span className="text-xs text-muted-foreground ml-2">({t('restaurant.category_dialog.modifier_group')})</span>}
                    </div>
                  )}
                  <div className="flex gap-1">
                     {editingCategory?.id === category.id ? (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700" onClick={handleUpdateCategory}>
                        <Check className="h-4 w-4" />
                      </Button>
                     ) : (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditing(category)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                     )}
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
          <Button variant="outline" onClick={() => handleOpenChange(false)}>{t('dialog.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
