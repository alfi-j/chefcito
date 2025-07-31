
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
import { MoreHorizontal, PlusCircle, Pencil, Trash2, Utensils } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { type Category, type MenuItem, type PaymentMethod } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { useI18n } from '@/context/i18n-context'
import { 
  getMenuItems, 
  getCategories, 
  addMenuItem, 
  updateMenuItem, 
  deleteMenuItem,
  getPaymentMethods,
  updatePaymentMethod as mockUpdatePaymentMethod,
  addPaymentMethod as mockAddPaymentMethod,
  deletePaymentMethod as mockDeletePaymentMethod,
} from '@/lib/mock-data';
import { MenuItemDialog } from './components/menu-item-dialog'
import { CategoryDialog } from './components/category-dialog'
import { PaymentMethodDialog } from './components/payment-method-dialog'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'


export default function RestaurantPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useI18n();

  const fetchAllData = useCallback(() => {
    setLoading(true);
    try {
        setMenuItems(getMenuItems());
        setCategories(getCategories());
        setPaymentMethods(getPaymentMethods());
    } catch (error) {
       console.error("Failed to fetch data:", error);
       toast({ title: t('toast.error'), description: t('restaurant.toast.fetch_error'), variant: "destructive" });
    } finally {
        setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleSaveItem = (itemData: MenuItem | Omit<MenuItem, 'id'>) => {
    const isEditMode = 'id' in itemData;
    try {
      if (isEditMode) {
        updateMenuItem(itemData as MenuItem);
      } else {
        addMenuItem(itemData as Omit<MenuItem, 'id'>);
      }
      fetchAllData();
      toast({ title: t('toast.success'), description: t(isEditMode ? 'restaurant.toast.item_updated' : 'restaurant.toast.item_added') });
    } catch(error: any) {
      toast({ title: t('toast.error'), description: error.message || t(isEditMode ? 'restaurant.toast.update_item_error' : 'restaurant.toast.add_item_error'), variant: "destructive" });
    }
  };

  const handleDeleteItem = (itemId: string) => {
     try {
      deleteMenuItem(itemId);
      fetchAllData();
      toast({ title: t('toast.success'), description: t('restaurant.toast.item_deleted') });
    } catch (error: any) {
       toast({ title: t('toast.error'), description: error.message || t('restaurant.toast.delete_item_error'), variant: "destructive" });
    }
  };
  
  const handleCategoriesUpdate = () => {
    fetchAllData();
  }

  const handlePaymentMethodToggle = (id: string, enabled: boolean) => {
    try {
      const method = paymentMethods.find(m => m.id === id);
      if(method) {
        mockUpdatePaymentMethod({ ...method, enabled });
        fetchAllData();
        toast({ title: t('toast.success'), description: t('restaurant.toast.payment_method_updated') });
      }
    } catch(error: any) {
      toast({ title: t('toast.error'), description: error.message || t('restaurant.toast.payment_method_update_error'), variant: "destructive" });
    }
  }

  const handleSavePaymentMethod = (methodData: PaymentMethod | Omit<PaymentMethod, 'id'>) => {
     const isEditMode = 'id' in methodData;
     try {
        if (isEditMode) {
          mockUpdatePaymentMethod(methodData as PaymentMethod);
        } else {
          mockAddPaymentMethod(methodData as Omit<PaymentMethod, 'id'>);
        }
        fetchAllData();
        toast({ title: t('toast.success'), description: t(isEditMode ? 'restaurant.toast.payment_method_updated' : 'restaurant.toast.payment_method_added') });
     } catch (error: any) {
        toast({ title: t('toast.error'), description: error.message || t(isEditMode ? 'restaurant.toast.payment_method_update_error' : 'restaurant.toast.payment_method_add_error'), variant: "destructive" });
     }
  }

  const handleDeletePaymentMethod = (id: string) => {
    try {
      mockDeletePaymentMethod(id);
      fetchAllData();
      toast({ title: t('toast.success'), description: t('restaurant.toast.payment_method_deleted') });
    } catch(error: any) {
      toast({ title: t('toast.error'), description: error.message || t('restaurant.toast.payment_method_delete_error'), variant: "destructive" });
    }
  }


  if (loading) {
    return (
        <div className="flex justify-center items-center h-full">
            <p>{t('restaurant.loading')}</p>
        </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-headline font-bold">{t('restaurant.title')}</h1>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="font-headline text-2xl">{t('restaurant.menu.title')}</CardTitle>
            <div className="flex gap-2">
              <CategoryDialog categories={categories} onUpdate={handleCategoriesUpdate} />
              <MenuItemDialog onSave={handleSaveItem} categories={categories}>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t('restaurant.menu.add_item')}
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
                    {t('restaurant.menu.table.image')}
                  </TableHead>
                  <TableHead>{t('restaurant.menu.table.name')}</TableHead>
                  <TableHead>{t('restaurant.menu.table.category')}</TableHead>
                  <TableHead>{t('restaurant.menu.table.status')}</TableHead>
                  <TableHead className="text-right">{t('restaurant.menu.table.price')}</TableHead>
                  <TableHead>
                    <span className="sr-only">{t('restaurant.menu.table.actions')}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menuItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="hidden sm:table-cell">
                      {item.imageUrl ? (
                        <Image
                          alt={item.name}
                          className="aspect-square rounded-md object-cover"
                          height="64"
                          src={item.imageUrl}
                          width="64"
                          data-ai-hint={item.aiHint}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                          <Utensils className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.category}</Badge>
                    </TableCell>
                     <TableCell>
                      <Badge variant={item.available ? "default" : "destructive"}>
                        {item.available ? t('restaurant.menu.status.available') : t('restaurant.menu.status.unavailable')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">${item.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">{t('restaurant.menu.table.toggle_menu')}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t('restaurant.menu.table.actions')}</DropdownMenuLabel>
                             <MenuItemDialog item={item} onSave={handleSaveItem} categories={categories}>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>{t('restaurant.menu.table.edit')}</DropdownMenuItem>
                            </MenuItemDialog>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteItem(item.id)}>{t('restaurant.menu.table.delete')}</DropdownMenuItem>
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
      
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-center">
            <div className="space-y-1">
              <CardTitle className="font-headline text-2xl">{t('restaurant.payment_methods.title')}</CardTitle>
              <CardDescription>{t('restaurant.payment_methods.desc')}</CardDescription>
            </div>
            <PaymentMethodDialog onSave={handleSavePaymentMethod}>
              <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t('restaurant.payment_methods.add_method')}
              </Button>
            </PaymentMethodDialog>
          </div>
        </CardHeader>
        <CardContent>
           <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('restaurant.payment_methods.table.name')}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t('restaurant.payment_methods.table.type')}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t('restaurant.payment_methods.table.enabled')}</TableHead>
                  <TableHead>
                    <span className="sr-only">{t('restaurant.payment_methods.table.actions')}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentMethods.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell className="font-medium">
                        {method.name}
                        <div className="text-sm text-muted-foreground sm:hidden">
                          {t(`restaurant.payment_methods.types.${method.type}`)}
                        </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary">{t(`restaurant.payment_methods.types.${method.type}`)}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Switch 
                        checked={method.enabled} 
                        onCheckedChange={(checked) => handlePaymentMethodToggle(method.id, checked)}
                        aria-label={`Enable ${method.name}`}
                      />
                    </TableCell>
                    <TableCell>
                       <div className="flex justify-end items-center gap-2">
                          <div className="flex items-center gap-2 sm:hidden">
                            <Label htmlFor={`enabled-switch-${method.id}`} className="text-sm">Enabled</Label>
                            <Switch 
                              id={`enabled-switch-${method.id}`}
                              checked={method.enabled} 
                              onCheckedChange={(checked) => handlePaymentMethodToggle(method.id, checked)}
                            />
                          </div>
                          <PaymentMethodDialog method={method} onSave={handleSavePaymentMethod}>
                            <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                          </PaymentMethodDialog>
                          <Button variant="ghost" size="icon" className="text-destructive/80 hover:text-destructive" onClick={() => handleDeletePaymentMethod(method.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
           </div>
        </CardContent>
      </Card>
    </div>
  )
}
