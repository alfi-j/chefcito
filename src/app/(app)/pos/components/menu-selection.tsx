"use client"
import { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { type MenuItem, type Category } from '@/lib/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Utensils } from 'lucide-react'
import { useI18nStore } from '@/lib/stores/i18n-store'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useCurrentOrderStore } from '@/lib/stores/current-order-store'

interface RenderedCategory extends Category {
  depth: number;
}

interface MenuSelectionProps {
  menuItems: MenuItem[];
  categories: Category[];
  onAddItem: (item: MenuItem) => void;
}

export function MenuSelection({ menuItems, categories, onAddItem }: MenuSelectionProps) {
  const { t } = useI18nStore();
  
  // Get current order items to display badges
  const orderItems = useCurrentOrderStore(state => state.items);

  const renderedCategories = useMemo(() => {
    const categoryMap = new Map(categories.map(c => [c.id, {...c, children: [] as Category[]}]));
    const roots: Category[] = [];

    categories.forEach(category => {
        if (category.parentId && categoryMap.has(category.parentId)) {
            (categoryMap.get(category.parentId) as any).children.push(category);
        } else {
            roots.push(category);
        }
    });
    
    const flattened: RenderedCategory[] = [];
    const traverse = (category: Category, depth: number) => {
        flattened.push({ ...category, depth });
        const children = (categoryMap.get(category.id) as any)?.children || [];
        children.sort((a: Category,b: Category) => a.name.localeCompare(b.name)).forEach((child: Category) => traverse(child, depth + 1));
    };

    roots.sort((a,b) => a.name.localeCompare(b.name)).forEach(root => traverse(root, 0));
    return flattened;
  }, [categories]);

  const [activeCategoryName, setActiveCategoryName] = useState<string>(() => {
    // Try to get the last selected category from localStorage
    if (typeof window !== 'undefined') {
      const savedCategory = localStorage.getItem('pos-last-category');
      if (savedCategory && (savedCategory === 'all' || categories.some(c => c.name === savedCategory))) {
        return savedCategory;
      }
    }
    // Default to first category or 'all' if no categories exist
    return renderedCategories[0]?.name || 'all';
  });

  // Save the selected category to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos-last-category', activeCategoryName);
    }
  }, [activeCategoryName]);

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

  const getDescendantCategoryNames = (categoryId: number): string[] => {
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
  }

  const itemsForActiveCategory = useMemo(() => {
    if (activeCategoryName === 'all') return menuItems;
    
    const activeCategory = categories.find(c => c.name === activeCategoryName);
    if (!activeCategory) return [];

    const relevantCategoryNames = getDescendantCategoryNames(activeCategory.id);
    
    return menuItems.filter(item => relevantCategoryNames.includes(item.category));
  }, [activeCategoryName, menuItems, categories, categoryMap, categoryChildrenMap]);
  
  if (categories.filter(c => !c.isModifierGroup).length === 0) {
    return (
       <Card className="h-full flex flex-col items-center justify-center">
        <CardHeader>
          <CardTitle className="font-headline">{t('pos.menu_selection.no_categories_title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{t('pos.menu_selection.no_categories_desc_1')}</p>
          <p className="text-sm text-muted-foreground">{t('pos.menu_selection.no_categories_desc_2')}</p>
        </CardContent>
       </Card>
    )
  }
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="font-headline">{t('pos.menu_selection.title')}</CardTitle>
        <Select value={activeCategoryName} onValueChange={setActiveCategoryName}>
          <SelectTrigger className="w-full sm:w-[280px]">
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
      </CardHeader>
      <CardContent className="flex-grow flex flex-col min-h-0">
          <div className="flex-grow relative mt-4">
            <ScrollArea className="absolute inset-0">
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 p-1">
                {itemsForActiveCategory.map(item => {
                  // Count how many of this item are in the current order
                  const itemCount = orderItems
                    .filter(orderItem => orderItem.menuItem.id === item.id)
                    .reduce((sum, orderItem) => sum + orderItem.quantity, 0);
                  
                  return (
                    <Card 
                      key={item.id} 
                      className="cursor-pointer hover:shadow-lg hover:border-primary transition-all flex flex-col overflow-hidden group relative"
                      onClick={() => onAddItem(item)}
                    >
                      <div className="w-full aspect-square relative bg-muted flex items-center justify-center">
                          {item.imageUrl && !item.imageUrl.startsWith("https://placehold.co") ? (
                              <Image src={item.imageUrl} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" data-ai-hint={item.aiHint} />
                          ) : (
                              <Utensils className="w-1/2 h-1/2 text-muted-foreground/50" />
                          )}
                          {itemCount > 0 && (
                            <Badge className="absolute top-1 right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full">
                              {itemCount}
                            </Badge>
                          )}
                      </div>
                      <CardFooter className="p-2 flex-grow flex flex-col items-start">
                        <p className="font-semibold font-body text-sm leading-tight">{item.name}</p>
                        <p className="text-xs text-primary font-bold">${item.price.toFixed(2)}</p>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
      </CardContent>
    </Card>
  )
}