
"use client"
import { useState, useMemo } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type MenuItem, type Category } from '@/lib/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Utensils } from 'lucide-react'
import { useI18n } from '@/context/i18n-context'

interface MenuSelectionProps {
  menuItems: MenuItem[];
  categories: Category[];
  onAddItem: (item: MenuItem) => void;
}

export function MenuSelection({ menuItems, categories, onAddItem }: MenuSelectionProps) {
  const { t } = useI18n();

  const topLevelCategories = useMemo(() => {
    const categoryMap = new Map(categories.map(c => [c.id, c]));
    return categories.filter(c => !c.parentId || !categoryMap.has(c.parentId));
  }, [categories]);

  const [activeTab, setActiveTab] = useState(topLevelCategories[0]?.name || '')

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

  const itemsForActiveTab = useMemo(() => {
    if (!activeTab) return [];
    
    const activeCategory = categories.find(c => c.name === activeTab);
    if (!activeCategory) return [];

    const relevantCategoryNames = getDescendantCategoryNames(activeCategory.id);
    
    return menuItems.filter(item => relevantCategoryNames.includes(item.category));
  }, [activeTab, menuItems, categories, categoryMap, categoryChildrenMap]);
  
  if (topLevelCategories.length === 0) {
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
      <CardHeader>
        <CardTitle className="font-headline">{t('pos.menu_selection.title')}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col">
          <TabsList className="flex flex-wrap h-auto">
            {topLevelCategories.map(category => (
              <TabsTrigger key={category.id} value={category.name}>{category.name}</TabsTrigger>
            ))}
          </TabsList>
          
          <div className="flex-grow relative mt-4">
            <ScrollArea className="absolute inset-0">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
                {itemsForActiveTab.map(item => (
                  <Card 
                    key={item.id} 
                    className="cursor-pointer hover:shadow-lg hover:border-primary transition-all flex flex-col overflow-hidden"
                    onClick={() => onAddItem(item)}
                  >
                    <div className="w-full aspect-video relative bg-muted flex items-center justify-center">
                        {item.imageUrl && !item.imageUrl.startsWith("https://placehold.co") ? (
                            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" data-ai-hint={item.aiHint} />
                        ) : (
                            <Utensils className="w-1/2 h-1/2 text-muted-foreground/50" />
                        )}
                    </div>
                    <CardFooter className="p-2 flex-grow flex flex-col items-start justify-between">
                      <p className="font-semibold font-body text-sm">{item.name}</p>
                      <p className="text-xs text-primary font-bold">${item.price.toFixed(2)}</p>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
