
"use client"
import Image from 'next/image'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { type OrderItem } from '@/lib/types'
import { MinusCircle, PlusCircle, Trash2, Send } from 'lucide-react'

interface CurrentOrderProps {
  items: OrderItem[];
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearOrder: () => void;
  onSendToKitchen: () => void;
}

export function CurrentOrder({ items, onUpdateQuantity, onRemoveItem, onClearOrder, onSendToKitchen }: CurrentOrderProps) {
  
  const subtotal = items.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0)
  const tax = subtotal * 0.08
  const total = subtotal + tax

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline">Current Order</CardTitle>
        <CardDescription>Table 4</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-grow">
          <div className="space-y-4 pr-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-10">
                <p>No items in order.</p>
                <p className="text-sm">Select items from the menu to get started.</p>
              </div>
            ) : (
              items.map(item => (
                <div key={item.id} className="flex items-center gap-4">
                   <Image src={item.menuItem.imageUrl} alt={item.menuItem.name} width={48} height={48} className="rounded-md object-cover" data-ai-hint={item.menuItem.aiHint} />
                  <div className="flex-grow">
                    <p className="font-semibold">{item.menuItem.name}</p>
                    <p className="text-sm text-muted-foreground">${item.menuItem.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}>
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                    <span className="font-bold w-4 text-center">{item.quantity}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/80 hover:text-destructive" onClick={() => onRemoveItem(item.id)}>
                    <Trash2 className="h-4 w-4"/>
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
      {items.length > 0 && (
        <CardFooter className="flex-col !p-4 border-t">
          <div className="w-full space-y-1 text-sm py-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-primary">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
          <Separator className="my-2" />
          <div className="w-full grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={onClearOrder}>Clear Order</Button>
            <Button variant="secondary">Payment</Button>
          </div>
          <Button className="w-full mt-2 bg-primary hover:bg-accent text-primary-foreground font-bold" onClick={onSendToKitchen}>
            <Send className="mr-2 h-4 w-4"/>
            Send to Kitchen
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
