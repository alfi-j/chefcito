
"use client"
import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type MenuItem } from '@/lib/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Utensils } from 'lucide-react'
import { useI18n } from '@/context/i18n-context'

interface MenuSelectionProps {
  menuItems: MenuItem[];
  categories: string[];
  onAddItem: (item: MenuItem) => void;
}

export function MenuSelection({ menuItems, categories, onAddItem }: MenuSelectionProps) {
  const [activeTab, setActiveTab] = useState(categories[0] || '')
  const { t } = useI18n()
  
  if (categories.length === 0) {
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
            {categories.map(category => (
              <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
            ))}
          </TabsList>
          
          <div className="flex-grow relative mt-4">
            <ScrollArea className="absolute inset-0">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
                {menuItems.filter(item => item.category === activeTab).map(item => (
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
