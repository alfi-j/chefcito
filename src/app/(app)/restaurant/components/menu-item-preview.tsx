
"use client"

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { type MenuItem } from '@/lib/types'
import { Utensils } from 'lucide-react'
import Image from 'next/image'

interface MenuItemPreviewProps {
  item: Partial<MenuItem> | null;
}

export function MenuItemPreview({ item }: MenuItemPreviewProps) {
    
    if (!item) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Select an item to preview or start creating a new one.</p>
            </div>
        )
    }

    const { name, price, imageUrl, aiHint } = item;

    const displayPrice = typeof price === 'string' ? parseFloat(price) : price;

    return (
        <Card className="overflow-hidden">
            <div className="w-full aspect-video relative bg-muted flex items-center justify-center">
                {imageUrl && !imageUrl.startsWith("https://placehold.co") ? (
                    <Image src={imageUrl} alt={name || 'Menu Item'} fill className="object-cover" data-ai-hint={aiHint} />
                ) : (
                    <Utensils className="w-1/2 h-1/2 text-muted-foreground/50" />
                )}
            </div>
            <CardFooter className="p-3 flex-grow flex flex-col items-start justify-between">
                <p className="font-semibold font-body text-base">{name || "Menu Item Name"}</p>
                <p className="text-sm text-primary font-bold">${(displayPrice ?? 0).toFixed(2)}</p>
            </CardFooter>
        </Card>
    )
}

    