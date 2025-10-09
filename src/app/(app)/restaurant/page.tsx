"use client"
import React, { useState, useCallback, useMemo, type DragEvent } from 'react';
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
import { 
  MoreHorizontal, 
  PlusCircle, 
  Pencil, 
  Trash2, 
  Utensils, 
  Search, 
  GripVertical, 
  Plus, 
  Minus, 
  FolderKanban,
  Edit,
  Package,
  CreditCard,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { type MenuItem, type PaymentMethod, type Category, type InventoryItem } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useI18n } from '@/context/i18n-context'
import { useMenu } from '@/hooks/use-menu'
import { MenuItemDialog } from './components/menu-item-dialog'
import { CategoryDialog } from './components/category-dialog'
import { PaymentMethodDialog } from './components/payment-method-dialog'
import { InventoryItemDialog } from './components/inventory-item-dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { BatchActionsToolbar } from './components/batch-actions-toolbar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'

interface RenderedCategory extends Category {
  depth: number;
}

function InventoryList({ 
  items, 
  menuItems, 
  onSave, 
  onAdjustStock,
  onDeleteItem,
}: { 
  items: InventoryItem[], 
  menuItems: MenuItem[], 
  onSave: (item: InventoryItem | Omit<InventoryItem, "id" | "lastRestocked">) => Promise<void>, 
  onAdjustStock: (itemId: string, adjustment: number) => Promise<void>,
  onDeleteItem: (itemId: string) => Promise<void>
}) {
    const { t } = useI18n();
    const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const handleOpenItemDialog = (item?: InventoryItem) => {
        setEditingItem(item);
        setIsItemDialogOpen(true);
    };
    
    const getStatusVariant = (item: InventoryItem) => {
        if (item.quantity <= 0) return 'destructive';
        if (item.quantity < item.reorderThreshold) return 'secondary';
        return 'default';
    }

    const getStatusText = (item: InventoryItem) => {
        if (item.quantity <= 0) return t('restaurant.inventory.status.out_of_stock');
        if (item.quantity < item.reorderThreshold) return t('restaurant.inventory.status.low_stock');
        return t('restaurant.inventory.status.in_stock');
    }

    const inventoryCategories = useMemo(() => {
        const cats = new Set(items.map(item => item.category).filter(Boolean));
        return Array.from(cats).sort();
    }, [items]);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [items, searchQuery, categoryFilter]);
    
    const renderContent = () => {
         if (filteredItems.length === 0) {
            return (
                <div className="text-center text-muted-foreground py-10">
                    <p>{t('orders.no_orders_found')}</p>
                </div>
            )
        }
        
        return (
            <>
                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                    {filteredItems.map(item => (
                        <Card key={item.id}>
                            <CardContent className="p-4 flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">{item.unit}</p>
                                    </div>
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">{t('restaurant.menu.table.toggle_menu')}</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>{t('restaurant.menu.table.actions')}</DropdownMenuLabel>
                                            <DropdownMenuItem onSelect={() => handleOpenItemDialog(item)}>{t('restaurant.menu.table.edit')}</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onSelect={() => onDeleteItem(item.id)} className="text-destructive">{t('restaurant.menu.table.delete')}</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                 <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onAdjustStock(item.id, -1)}>
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="font-semibold w-8 text-center">{item.quantity}</span>
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onAdjustStock(item.id, 1)}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Badge variant={getStatusVariant(item)}>{getStatusText(item)}</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('restaurant.inventory.table.name')}</TableHead>
                                <TableHead>{t('restaurant.inventory.table.unit')}</TableHead>
                                <TableHead>{t('restaurant.inventory.table.status')}</TableHead>
                                <TableHead className="text-right w-[200px]">{t('restaurant.inventory.table.in_stock')}</TableHead>
                                <TableHead className="w-[100px]">
                                    <span className="sr-only">{t('restaurant.menu.table.actions')}</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredItems.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>{item.unit}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(item)}>{getStatusText(item)}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAdjustStock(item.id, -1)}>
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <span className="font-semibold w-8 text-center">{item.quantity}</span>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAdjustStock(item.id, 1)}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
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
                                                    <DropdownMenuItem onSelect={() => handleOpenItemDialog(item)}>{t('restaurant.menu.table.edit')}</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onSelect={() => onDeleteItem(item.id)} className="text-destructive">{t('restaurant.menu.table.delete')}</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </>
        )
    }

    return (
        <>
        <InventoryItemDialog 
            isOpen={isItemDialogOpen}
            onOpenChange={setIsItemDialogOpen}
            item={editingItem}
            onSave={onSave}
            menuItems={menuItems}
        />
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1">
                        <CardTitle className="font-headline">{t('restaurant.inventory.title')}</CardTitle>
                        <CardDescription>{t('restaurant.inventory.desc')}</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder={t('restaurant.menu.search_placeholder')}
                                className="pl-8 w-full sm:w-[200px] lg:w-[250px]"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-full sm:w-auto min-w-[180px]">
                                <SelectValue placeholder={t('restaurant.menu.filter_by_category')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('restaurant.menu.all_categories')}</SelectItem>
                                {inventoryCategories.map(cat => (
                                    <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button onClick={() => handleOpenItemDialog()} size="icon" className="w-full sm:w-10">
                                        <PlusCircle className="h-4 w-4" />
                                        <span className="sr-only">{t('restaurant.inventory.add_item')}</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('restaurant.inventory.add_item')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                 {renderContent()}
            </CardContent>
        </Card>
        </>
    )
}

function MenuList({ 
  menuItems, 
  categories, 
  onUpdateCategories,
  onSaveItem,
  onDeleteItem,
  onDeleteMultipleItems,
  onReorderItems
}: { 
  menuItems: MenuItem[], 
  categories: Category[], 
  onUpdateCategories: (category: Omit<Category, "id">) => Promise<any>,
  onSaveItem: (item: any) => Promise<any>,
  onDeleteItem: (id: string) => Promise<any>,
  onDeleteMultipleItems: (ids: string[]) => Promise<any>,
  onReorderItems: (items: MenuItem[]) => Promise<any>,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | undefined>(undefined);
  
  const { t } = useI18n();

  const handleOpenItemDialog = (item?: MenuItem) => {
    setEditingItem(item);
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
    
    const fromIndex = menuItems.findIndex(item => item.id === draggedItemId);
    const toIndex = menuItems.findIndex(item => item.id === dropItemId);
    
    if (fromIndex === -1 || toIndex === -1) {
      handleDragEnd();
      return;
    }

    const reorderedItems = [...menuItems];
    const [removed] = reorderedItems.splice(fromIndex, 1);
    reorderedItems.splice(toIndex, 0, removed);
    
    onReorderItems(reorderedItems); // Optimistic update via prop
    
    handleDragEnd();
  };
  
  const handleDragEnter = (e: DragEvent<HTMLTableRowElement>, itemId: string) => {
    e.preventDefault();
    if (draggedItemId !== itemId) {
      setDragOverItemId(itemId);
    }
  };
  
  const onDeleteMultiple = async () => {
    await onDeleteMultipleItems(selectedItemIds);
    setSelectedItemIds([]);
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
  
  const categoryMap = useMemo(() => {
    const map = new Map<number, Category>();
    categories.forEach(c => map.set(c.id, c));
    return map;
  }, [categories]);

  const categoryChildrenMap = useMemo(() => {
    const map = new Map<number, number[]>();
    categories.forEach(c => {
        if (c.parentId) {
            if (!map.has(c.parentId)) {
                map.set(c.parentId, []);
            }
            map.get(c.parentId)!.push(c.id);
        }
    });
    return map;
  }, [categories]);

  const getDescendantCategoryNames = useCallback((categoryId: number): string[] => {
    const names: string[] = [];
    const queue: number[] = [categoryId];
    const visited = new Set<number>();

    while(queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);
        
        const category = categoryMap.get(currentId);
        if (category) {
            names.push(category.name);
        }

        const children = categoryChildrenMap.get(currentId);
        if (children) {
            queue.push(...children);
        }
    }
    return names;
  }, [categoryMap, categoryChildrenMap]);
  
  const renderedCategories = useMemo(() => {
    const categoryIdMap = new Map(categories.map(c => [c.id, {...c, children: [] as Category[]}]));
    const roots: Category[] = [];

    categories.forEach(category => {
        if (category.parentId && categoryIdMap.has(category.parentId)) {
            categoryIdMap.get(category.parentId)!.children.push(category as any);
        } else {
            roots.push(category);
        }
    });
    
    const flattened: RenderedCategory[] = [];
    const traverse = (category: Category, depth: number) => {
        flattened.push({ ...category, depth });
        const children = categoryIdMap.get(category.id)?.children || [];
        children.sort((a,b) => a.name.localeCompare(b.name)).forEach(child => traverse(child, depth + 1));
    };

    roots.sort((a,b) => a.name.localeCompare(b.name)).forEach(root => traverse(root, 0));
    return flattened;
  }, [categories]);


  const filteredItems = useMemo(() => {
    let items = [...menuItems];
    
    if (categoryFilter !== 'all') {
      const selectedCategory = categories.find(c => c.name === categoryFilter);
      if (selectedCategory) {
        const relevantCategoryNames = getDescendantCategoryNames(selectedCategory.id);
        items = items.filter(item => relevantCategoryNames.includes(item.category));
      } else {
        items = [];
      }
    }

    if (searchQuery) {
      items = items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (!isSortingEnabled) {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }

    return items;
  }, [menuItems, categoryFilter, searchQuery, isSortingEnabled, categories, getDescendantCategoryNames]);


  const numSelected = selectedItemIds.length;
  const numVisible = filteredItems.length;
  const isAllSelected = numVisible > 0 && numSelected === numVisible;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div className="flex-1">
            <CardTitle className="font-headline">{t('restaurant.menu.title')}</CardTitle>
            <CardDescription>{t('restaurant.menu.desc')}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto md:justify-end">
            <div className="relative w-full sm:w-auto grow sm:grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
              type="search"
              placeholder={t('restaurant.menu.search_placeholder')}
              className="pl-8 w-full sm:w-[200px] lg:w-[250px]"
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
                <SelectTrigger className="w-full sm:w-auto min-w-[180px] grow sm:grow-0">
                <SelectValue placeholder={t('restaurant.menu.filter_by_category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('restaurant.menu.all_categories')}</SelectItem>
                  {renderedCategories.filter(c => !c.isModifierGroup).map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>
                      <span style={{ paddingLeft: `${cat.depth * 1.25}rem` }}>{cat.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
            </Select>
            <TooltipProvider>
              <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <CategoryDialog 
                        categories={categories} 
                        onUpdate={(category) => onUpdateCategories(category)}
                        trigger={
                          <Button variant="outline" size="icon">
                            <FolderKanban className="h-4 w-4" />
                            <span className="sr-only">{t('restaurant.menu.manage_categories')}</span>
                          </Button>
                        }
                      />

                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                      <p>{t('restaurant.menu.manage_categories')}</p>
                  </TooltipContent>
              </Tooltip>
              <Tooltip>
                  <TooltipTrigger asChild>
                      <Button onClick={() => handleOpenItemDialog()} size="icon">
                          <PlusCircle className="h-4 w-4" />
                           <span className="sr-only">{t('restaurant.menu.add_item')}</span>
                      </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                      <p>{t('restaurant.menu.add_item')}</p>
                  </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>

      <MenuItemDialog
        isOpen={isItemDialogOpen}
        onOpenChange={setIsItemDialogOpen}
        item={editingItem}
        onSave={onSaveItem}
        categories={categories}
      />

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
                    className={cn(
                        "transition-all",
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
                            <DropdownMenuItem className="text-destructive" onClick={() => onDeleteItem(item.id)}>{t('restaurant.menu.table.delete')}</DropdownMenuItem>
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


function PaymentMethods({
  paymentMethods,
  onSave,
  onDelete,
  onToggle,
}: {
  paymentMethods: PaymentMethod[],
  onSave: (method: PaymentMethod | Omit<PaymentMethod, 'id'>) => Promise<void>,
  onDelete: (id: string) => Promise<void>,
  onToggle: (id: string, enabled: boolean) => Promise<void>,
}) {
    const { t } = useI18n();
    
    return (
        <Card>
            <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
                <div className="flex-1">
                  <CardTitle className="font-headline text-2xl">{t('restaurant.payment_methods.title')}</CardTitle>
                  <CardDescription>{t('restaurant.payment_methods.desc')}</CardDescription>
                </div>
                <PaymentMethodDialog onSave={onSave}>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t('restaurant.payment_methods.add_method')}
                </Button>
                </PaymentMethodDialog>
            </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
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
                                  onCheckedChange={(checked) => onToggle(method.id, checked)}
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
                            onCheckedChange={(checked) => onToggle(method.id, checked)}
                            aria-label={`Enable ${method.name}`}
                        />
                        </TableCell>
                        <TableCell>
                        <div className="flex justify-end items-center gap-2">
                            <PaymentMethodDialog method={method} onSave={onSave}>
                                <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                            </PaymentMethodDialog>
                            <Button variant="ghost" size="icon" className="text-destructive/80 hover:text-destructive" onClick={() => onDelete(method.id)}>
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
    )
}

export default function RestaurantPage() {
  const { t } = useI18n();
  
  const {
    menuItems,
    categories,
    inventoryItems,
    paymentMethods,
    loading,
    addCategory,
    updateMenuItemOrder,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    deleteMenuItems,
    addInventoryItem,
    updateInventoryItem,
    adjustInventoryStock,
    deleteInventoryItem,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
  } = useMenu();


  if (loading) {
    return (
        <div className="flex justify-center items-center h-full">
            <p>{t('restaurant.loading')}</p>
        </div>
    )
  }

  return (
    <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-headline font-bold">{t('restaurant.title')}</h1>
        </div>

        <Tabs defaultValue="menu" className="space-y-4">
            <TabsList>
                <TabsTrigger value="menu">{t('restaurant.menu.title')}</TabsTrigger>
                <TabsTrigger value="inventory">{t('restaurant.inventory.title')}</TabsTrigger>
                <TabsTrigger value="payment">{t('restaurant.payment_methods.title')}</TabsTrigger>
            </TabsList>
            <TabsContent value="menu" className="mt-4">
                 <MenuList 
                    menuItems={menuItems} 
                    categories={categories} 
                    onUpdateCategories={addCategory} 
                    onSaveItem={(item: any) => item.id ? updateMenuItem(item.id, item) : addMenuItem(item)}
                    onDeleteItem={deleteMenuItem}
                    onDeleteMultipleItems={deleteMenuItems}
                    onReorderItems={(items) => updateMenuItemOrder(0, items.map(i => i.id))}
                 />
            </TabsContent>
            <TabsContent value="inventory" className="mt-4">
                <InventoryList 
                    items={inventoryItems} 
                    menuItems={menuItems} 
                    onSave={(item) => 'id' in item ? updateInventoryItem(item.id, item) : addInventoryItem({ ...item, lastRestocked: new Date().toISOString() })}
                    onAdjustStock={adjustInventoryStock}
                    onDeleteItem={deleteInventoryItem}
                />

            </TabsContent>
             <TabsContent value="payment" className="mt-4">
                <PaymentMethods 
                    paymentMethods={paymentMethods}
                    onSave={(method) => 'id' in method ? updatePaymentMethod(method.id, method) : addPaymentMethod(method)}
                    onDelete={deletePaymentMethod}
                    onToggle={(id, enabled) => updatePaymentMethod(id, {enabled})}
                />

            </TabsContent>
        </Tabs>
      </div>
  );
}
