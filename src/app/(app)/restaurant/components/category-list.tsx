"use client"

import React, { useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2 } from "lucide-react"
import { type Category } from "@/lib/types"
import { useI18nStore } from '@/lib/stores/i18n-store'
import { useNormalizedMenuStore } from '@/lib/stores/menu-store-normalized'
import { DeleteConfirmationDialog } from './delete-confirmation-dialog'
import { toast } from "sonner"

interface CategoryListProps {
  categories?: Category[]
  onEdit: (category: Category) => void
}

interface RenderedCategory extends Category {
  depth: number
}

export function CategoryList({ categories = [], onEdit }: CategoryListProps) {
  const { t } = useI18nStore()
  const { deleteCategory, isCategoryInUse } = useNormalizedMenuStore()

  const renderedCategories = useMemo(() => {
    if (!categories || categories.length === 0) return [];
    
    const categoryMap = new Map(categories.map(c => [c.id, { ...c, children: [] as Category[] }]))
    const roots: Category[] = []

    categories.forEach(category => {
      if (category.parentId && categoryMap.has(category.parentId)) {
        categoryMap.get(category.parentId)!.children.push(category as any)
      } else {
        roots.push(category)
      }
    })

    const flattened: RenderedCategory[] = []
    const traverse = (category: Category, depth: number) => {
      flattened.push({ ...category, depth })
      const children = categoryMap.get(category.id)?.children || []
      children.sort((a, b) => a.name.localeCompare(b.name)).forEach(child => traverse(child, depth + 1))
    }

    roots.sort((a, b) => a.name.localeCompare(b.name)).forEach(root => traverse(root, 0))
    return flattened
  }, [categories])

  const handleDeleteCategory = async (id: number, name: string) => {
    try {
      if (await isCategoryInUse(id)) {
        toast.error(t('restaurant.categories.delete_error_in_use', { name }))
        return
      }
      await deleteCategory(id)
      toast.success(t('restaurant.categories.delete_success', { name }))
    } catch (error: any) {
      toast.error(error.message || t('restaurant.categories.delete_error'))
    }
  }

  if (renderedCategories.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{t('restaurant.categories.no_categories')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {renderedCategories.map((category) => (
        <Card key={category.id} className="hover:shadow-sm transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div style={{ paddingLeft: `${category.depth * 1.5}rem` }} />
                <span className="font-medium">{category.name}</span>
                {category.isModifierGroup && (
                  <Badge variant="secondary">{t('restaurant.categories.modifier_group')}</Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(category)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <DeleteConfirmationDialog
                  count={1}
                  onConfirm={() => handleDeleteCategory(category.id, category.name)}
                >
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DeleteConfirmationDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}