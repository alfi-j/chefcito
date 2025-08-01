
"use client"
import React, { useState, type DragEvent } from 'react'
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
import { MoreHorizontal, PlusCircle, Pencil, Trash2, Utensils, Search, GripVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { type MenuItem, type PaymentMethod } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useI18n } from '@/context/i18n-context'
import { 
  updateMenuItemOrder,
} from '@/lib/mock-data';
import { MenuItemDialog } from './components/menu-item-dialog'
import { CategoryDialog } from './components/category-dialog'
import { PaymentMethodDialog } from './components/payment-method-dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from '@/lib/utils'
import { MenuItemPreview } from './components/menu-item-preview'
import { Checkbox } from '@/components/ui/checkbox'
import { BatchActionsToolbar } from './components/batch-actions-toolbar'
import { useMenu } from '@/hooks/use-menu'


export default function RestaurantPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<Partial<MenuItem> | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | undefined>(undefined);
  
  const { t } = useI18n();
  
  const {
    menuItems,
    categories,
    paymentMethods,
    loading,
    handleSaveItem,
    handleDeleteItem,
    handleDeleteMultipleItems,
    handleCategoriesUpdate,
    handleSavePaymentMethod,
    handleDeletePaymentMethod,
    handlePaymentMethodToggle,
    setMenuItems,
  } = useMenu();


  const handleOpenItemDialog = (item?: MenuItem) => {
    setEditingItem(item);
    setPreviewItem(item || {});
    setIsItemDialogOpen(true);
  };
  
  const handleDragStart = (e: DragEvent<HTMLTableRowElement>, itemId: string) => {
    setDraggedItemId(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverItemId(null);
  };

  const handleDragOver = (e: DragEvent<HTMLTableRowElement>) => {
    e.preventDefault();
  };

  const handleDrop = async (e: DragEvent<HTMLTableRowElement>, dropItemId: string) => {
    e.preventDefault();
    if (draggedItemId === null || draggedItemId === dropItemId) {
      handleDragEnd();
      return;
    }
    
    const originalItems = [...menuItems];
    const fromIndex = originalItems.findIndex(item => item.id === draggedItemId);
    const toIndex = originalItems.findIndex(item => item.id === dropItemId);
    
    if (fromIndex === -1 || toIndex === -1) {
      handleDragEnd();
      return;
    }

    const reorderedItems = [...originalItems];
    const [removed] = reorderedItems.splice(fromIndex, 1);
    reorderedItems.splice(toIndex, 0, removed);
    
    setMenuItems(reorderedItems); // Optimistic update
    
    const orderedIds = reorderedItems.map(item => item.id);
    
    try {
      await updateMenuItemOrder(orderedIds);
    } catch(error: any) {
       setMenuItems(originalItems); // Revert on error
    } finally {
      handleDragEnd();
    }
  };
  
  const handleDragEnter = (e: DragEvent<HTMLTableRowElement>, itemId: string) => {
    e.preventDefault();
    if (draggedItemId !== itemId) {
      setDragOverItemId(itemId);
    }
  };
  
  const onDeleteMultiple = async () => {
    await handleDeleteMultipleItems(selectedItemIds);
    setSelectedItemIds([]);
    setPreviewItem(null);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItemIds(filteredItems.map(item => item.id));
    } else {
      setSelectedItemIds([]);
    }
  }

  const handleRowSelect = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItemIds(prev => [...prev, itemId]);
    } else {
      setSelectedItemIds(prev => prev.filter(id => id !== itemId));
    }
  }
  
  const isSortingEnabled = !searchQuery && categoryFilter === 'all';

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (!isSortingEnabled) {
    filteredItems.sort((a, b) => a.name.localeCompare(b.name));
  }

  const numSelected = selectedItemIds.length;
  const numVisible = filteredItems.length;
  const isAllSelected = numVisible > 0 && numSelected === numVisible;


  if (loading) {
    return (
        <div className="flex justify-center items-center h-full">
            <p>{t('restaurant.loading')}</p>
        </div>
    )
  }

  return (
    <>
      <MenuItemDialog
        isOpen={isItemDialogOpen}
        onOpenChange={setIsItemDialogOpen}
        item={editingItem}
        onSave={handleSaveItem}
        categories={categories}
      />
      
      <div className="space-y-8">
        <h1 className="text-3xl font-headline font-bold">{t('restaurant.title')}</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
              <Card>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <CardTitle className="font-headline text-2xl">{t('restaurant.menu.title')}</CardTitle>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <CategoryDialog categories={categories} onUpdate={handleCategoriesUpdate} />
                          <Button onClick={() => handleOpenItemDialog()} className="w-full sm:w-auto">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {t('restaurant.menu.add_item')}
                          </Button>
                        </div>
                    </div>
                     <div className="mt-4 flex flex-col sm:flex-row items-center gap-2">
                        <div className="relative w-full sm:flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                            type="search"
                            placeholder={t('restaurant.menu.search_placeholder')}
                            className="pl-8 w-full"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setSelectedItemIds([]);
                            }}
                            />
                        </div>
                        <Select
                            value={categoryFilter}
                            onValueChange={(value) => {
                                setCategoryFilter(value);
                                setSelectedItemIds([]);
                            }}
                        >
                            <SelectTrigger className="w-full sm:w-[220px]">
                            <SelectValue placeholder={t('restaurant.menu.filter_by_category')} />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="all">{t('restaurant.menu.all_categories')}</SelectItem>
                            {categories.filter(c => !c.isModifierGroup).map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {numSelected > 0 && (
                        <BatchActionsToolbar 
                          selectedCount={numSelected}
                          onDelete={onDeleteMultiple}
                        />
                    )}
                    <div className="border rounded-lg">
                        <Table>
                        <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">
                                <Checkbox
                                  checked={isAllSelected}
                                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                  aria-label="Select all"
                                />
                              </TableHead>
                              <TableHead className="w-8"></TableHead>
                              <TableHead className="hidden w-[100px] sm:table-cell">
                                  {t('restaurant.menu.table.image')}
                              </TableHead>
                              <TableHead>{t('restaurant.menu.table.name')}</TableHead>
                              <TableHead className="hidden md:table-cell">{t('restaurant.menu.table.category')}</TableHead>
                              <TableHead className="hidden sm:table-cell">{t('restaurant.menu.table.status')}</TableHead>
                              <TableHead className="text-right">{t('restaurant.menu.table.price')}</TableHead>
                              <TableHead>
                                  <span className="sr-only">{t('restaurant.menu.table.actions')}</span>
                              </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredItems.map((item) => (
                            <TableRow 
                                key={item.id}
                                data-state={selectedItemIds.includes(item.id) && "selected"}
                                draggable={isSortingEnabled}
                                onDragStart={(e) => handleDragStart(e, item.id)}
                                onDragEnd={handleDragEnd}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, item.id)}
                                onDragEnter={(e) => handleDragEnter(e, item.id)}
                                onClick={() => setPreviewItem(item)}
                                className={cn(
                                    "transition-all cursor-pointer",
                                    isSortingEnabled && "cursor-grab",
                                    draggedItemId === item.id && "opacity-50",
                                    dragOverItemId === item.id && "bg-primary/10"
                                )}
                            >
                                <TableCell>
                                  <Checkbox
                                    checked={selectedItemIds.includes(item.id)}
                                    onCheckedChange={(checked) => handleRowSelect(item.id, !!checked)}
                                    aria-label="Select row"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </TableCell>
                                <TableCell className="w-8">
                                {isSortingEnabled && <GripVertical className="h-5 w-5 text-muted-foreground" />}
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">
                                {item.imageUrl && !item.imageUrl.startsWith('https://placehold.co') ? (
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
                                <TableCell className="hidden md:table-cell">
                                <Badge variant="secondary">{item.category}</Badge>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">
                                <Badge variant={item.available ? "default" : "destructive"}>
                                    {item.available ? t('restaurant.menu.status.available') : t('restaurant.menu.status.unavailable')}
                                </Badge>
                                </TableCell>
                                <TableCell className="text-right font-semibold">${item.price.toFixed(2)}</TableCell>
                                <TableCell>
                                <div className="flex justify-end">
                                    <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">{t('restaurant.menu.table.toggle_menu')}</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenuLabel>{t('restaurant.menu.table.actions')}</DropdownMenuLabel>
                                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleOpenItemDialog(item); }}>{t('restaurant.menu.table.edit')}</DropdownMenuItem>
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
                                  <div className="mt-1 flex items-center gap-2 sm:hidden">
                                      <Badge variant="secondary">{t(`restaurant.payment_methods.types.${method.type}`)}</Badge>
                                      <Switch 
                                        id={`enabled-switch-mobile-${method.id}`}
                                        checked={method.enabled} 
                                        onCheckedChange={(checked) => handlePaymentMethodToggle(method.id, checked)}
                                        aria-label={`Enable ${method.name}`}
                                      />
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
          <div className="lg:col-span-1">
              <Card className="sticky top-8">
                  <CardHeader>
                      <CardTitle className="font-headline">{t('restaurant.preview.title')}</CardTitle>
                      <CardDescription>{t('restaurant.preview.desc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <MenuItemPreview item={previewItem} />
                  </CardContent>
              </Card>
          </div>
        </div>
      </div>
    </>
  )
}
