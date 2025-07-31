
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
import { MoreHorizontal, PlusCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { type Category, type MenuItem } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useI18n } from '@/context/i18n-context'
import { getMenuItems, getCategories, addMenuItem, updateMenuItem, deleteMenuItem, isCategoryInUse as mockIsCategoryInUse } from '@/lib/mock-data';
import { MenuItemDialog } from './components/menu-item-dialog'
import { CategoryDialog } from './components/category-dialog'


export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useI18n();

  const fetchAllData = useCallback(() => {
    setLoading(true);
    try {
        setMenuItems(getMenuItems());
        setCategories(getCategories());
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
    try {
      if (isEditMode) {
        updateMenuItem(itemData as MenuItem);
      } else {
        addMenuItem(itemData as Omit<MenuItem, 'id'>);
      }
      fetchAllData();
      toast({ title: t('toast.success'), description: t(isEditMode ? 'menu.toast.item_updated' : 'menu.toast.item_added') });
    } catch(error: any) {
      toast({ title: t('toast.error'), description: error.message || t(isEditMode ? 'menu.toast.update_item_error' : 'menu.toast.add_item_error'), variant: "destructive" });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
     try {
      deleteMenuItem(itemId);
      fetchAllData();
      toast({ title: t('toast.success'), description: t('menu.toast.item_deleted') });
    } catch (error: any) {
       toast({ title: t('toast.error'), description: error.message || t('menu.toast.delete_item_error'), variant: "destructive" });
    }
  };
  
  const handleCategoriesUpdate = () => {
    fetchAllData();
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
