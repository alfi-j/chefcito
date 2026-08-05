"use client"

import React, { useMemo, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Utensils } from "lucide-react"
import { type MenuItem, type Category } from "@/lib/types"
import { useTranslation } from 'react-i18next'
import { useMenuStore } from '@/lib/stores/menu-store'
import { DeleteConfirmationDialog } from './delete-confirmation-dialog'
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface MenuItemListProps {
  menuItems?: MenuItem[]
  categories?: Category[]
  onEdit: (item: MenuItem) => void
}

interface CategoryOption {
  name: string
  label?: string
}

export function MenuItemList({ menuItems = [], categories = [], onEdit }: MenuItemListProps) {
  const { t } = useTranslation()
  const { deleteMenuItem } = useMenuStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const filteredMenuItems = useMemo(() => {
    if (!menuItems) return [];
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [menuItems, searchTerm, selectedCategory])

  const handleDeleteItem = async (id: string, name: string) => {
    try {
      await deleteMenuItem(id)
      toast.success(t('restaurant.menu_items.delete_success', { name }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('restaurant.menu_items.delete_error'))
    }
  }

  const categoryOptions = useMemo<CategoryOption[]>(() => {
    return [{ name: 'all', label: t('restaurant.menu_items.all_categories') }, ...(categories || [])]
  }, [categories, t])

  if (menuItems.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{t('restaurant.menu_items.no_items')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder={t('restaurant.menu_items.search')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map(category => (
              <SelectItem key={category.name} value={category.name}>
                {category.name === 'all' ? category.label : category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredMenuItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>{t('restaurant.menu_items.no_matches')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMenuItems.map((item) => (
            <Card key={item.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-16 h-16 rounded-md object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                        <Utensils className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <h3 className="font-medium truncate">{item.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">${item.price.toFixed(2)}</Badge>
                          <Badge variant="secondary">{item.category}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <DeleteConfirmationDialog
                          count={1}
                          onConfirm={() => handleDeleteItem(item.id, item.name)}
                        >
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DeleteConfirmationDialog>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}