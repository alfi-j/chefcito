
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
import { useI18n } from '@/context/i18n-context'
<<<<<<< HEAD
import { addCategory, updateCategory, deleteCategory as mockDeleteCategory } from '@/lib/mock-data';
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { MultiSelect } from './multi-select'
=======
import { categoriesApi } from '@/lib/api-client';
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { MultiSelect } from './multi-select'
import { FolderKanban } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
>>>>>>> d3399ff (Chefcito Beta!)

interface RenderedCategory extends Category {
  depth: number;
}

<<<<<<< HEAD
export function CategoryDialog({ categories, onUpdate }: { categories: Category[], onUpdate: () => void }) {
=======
export function CategoryDialog({ children, categories, onUpdate }: { children?: React.ReactNode, categories: Category[], onUpdate: () => void }) {
>>>>>>> d3399ff (Chefcito Beta!)
  const [isOpen, setIsOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isNewCategoryModifier, setIsNewCategoryModifier] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { t } = useI18n();
  
<<<<<<< HEAD
  const modifierOptions = useMemo(() => 
=======
  const modifierGroups = useMemo(() => 
>>>>>>> d3399ff (Chefcito Beta!)
    categories
        .filter(c => c.isModifierGroup)
        .map(c => ({ value: c.name, label: c.name })), 
    [categories]
  );

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
<<<<<<< HEAD
      await addCategory({
=======
      await categoriesApi.create({
>>>>>>> d3399ff (Chefcito Beta!)
        name: newCategoryName, 
        isModifierGroup: isNewCategoryModifier
      });
      onUpdate();
      setNewCategoryName('');
      setIsNewCategoryModifier(false);
      toast.success(t('toast.success'), { description: t('restaurant.toast.category_added'), duration: 3000 });
    } catch(error: any) {
      toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.add_category_error'), duration: 3000 });
    }
  };

  const handleDeleteCategory = async (id: number, name: string) => {
    try {
<<<<<<< HEAD
      await mockDeleteCategory(id);
=======
      // Replace mock isCategoryInUse and mockDeleteCategory with API calls
      // For now, we'll skip the in-use check and directly delete
      await categoriesApi.delete(id);
>>>>>>> d3399ff (Chefcito Beta!)
      onUpdate();
      toast.success(t('toast.success'), { description: t('restaurant.toast.category_deleted'), duration: 3000 });
    } catch(error: any) {
      toast.error(t('toast.error'), { description: error.message || t('restaurant.toast.delete_category_error'), duration: 3000 });
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return;
    try {
<<<<<<< HEAD
      await updateCategory(editingCategory);
=======
      // Replace mock updateCategory with API call
      await categoriesApi.update(editingCategory);
>>>>>>> d3399ff (Chefcito Beta!)
      onUpdate();
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

<<<<<<< HEAD
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      if (editingCategory) {
        await updateCategory({ ...editingCategory, name: newCategoryName.trim() });
        onUpdate();
        handleOpenChange(false);
      } else {
        await addCategory({ name: newCategoryName.trim() });
        onUpdate();
        handleOpenChange(false);
      }
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };
=======
>>>>>>> d3399ff (Chefcito Beta!)

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
<<<<<<< HEAD
        <Button variant="outline">{t('restaurant.menu.manage_categories')}</Button>
=======
        {children || (
          <Button variant="outline" size="icon">
            <FolderKanban className="h-4 w-4" />
            <span className="sr-only">{t('restaurant.menu.manage_categories')}</span>
          </Button>
        )}
>>>>>>> d3399ff (Chefcito Beta!)
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
<<<<<<< HEAD
                                  setEditingCategory({...editingCategory, parentId: value === 'null' ? undefined : Number(value)})
=======
                                  setEditingCategory({...editingCategory, parentId: value === 'null' ? null : Number(value)})
>>>>>>> d3399ff (Chefcito Beta!)
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
<<<<<<< HEAD
                            options={modifierOptions}
                            selected={editingCategory.linkedModifiers || []}
                            onChange={(selected) => setEditingCategory({...editingCategory, linkedModifiers: selected as string[]})}
                            placeholder={t('restaurant.categories.dialog.select_modifiers')}
                          />

=======
                            options={modifierGroups}
                            selected={editingCategory.linkedModifiers || []}
                            onChange={(selected) => {
                               if (editingCategory) {
                                 // Handle SetStateAction type properly
                                 const newSelected = typeof selected === 'function' 
                                   ? selected(editingCategory.linkedModifiers || []) 
                                   : selected;
                                   
                                const updated: Category = {
                                  id: editingCategory.id,
                                  name: editingCategory.name,
                                  isModifierGroup: editingCategory.isModifierGroup,
                                  linkedModifiers: newSelected,
                                  parentId: editingCategory.parentId
                                };
                                setEditingCategory(updated);
                               }
                            }}
                            className="mt-1"
                          />
>>>>>>> d3399ff (Chefcito Beta!)
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
