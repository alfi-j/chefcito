"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { type Order, type OrderItem as OrderItemType } from "@/lib/data"
import { cn } from "@/lib/utils"
import { Clock, ChevronsUpDown } from 'lucide-react'
import { useState, useEffect } from "react"

interface OrderCardProps {
  order: Order
  onUpdateItemStatus: (orderId: number, itemId: string, newStatus: 'New' | 'Cooking' | 'Cooked') => void
}

const statusColors = {
  New: 'bg-blue-500',
  Cooking: 'bg-yellow-500',
  Cooked: 'bg-green-500',
};

const statusSequence: ('New' | 'Cooking' | 'Cooked')[] = ['New', 'Cooking', 'Cooked'];

function OrderItem({ item, orderId, onUpdateItemStatus }: { item: OrderItemType, orderId: number, onUpdateItemStatus: OrderCardProps['onUpdateItemStatus'] }) {
  const handleStatusChange = () => {
    const currentIndex = statusSequence.indexOf(item.status);
    const nextIndex = (currentIndex + 1) % statusSequence.length;
    onUpdateItemStatus(orderId, item.id, statusSequence[nextIndex]);
  };
  
  return (
    <div 
      className={cn(
        "p-2 rounded-md transition-all cursor-pointer flex justify-between items-center text-sm",
        item.status === 'Cooked' ? 'bg-muted/50 text-muted-foreground opacity-60 line-through' : 'bg-card hover:bg-muted/80'
      )}
      onClick={handleStatusChange}
    >
      <div className="flex items-center gap-2">
        <div className={cn("w-2 h-2 rounded-full", statusColors[item.status])} />
        <span className="font-bold">{item.quantity}x</span>
        <span className="truncate">{item.menuItem.name}</span>
      </div>
      <span className="text-xs font-bold">{item.status}</span>
    </div>
  )
}

function useTimeAgo(date: Date) {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const update = () => {
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      if (hours > 0) setTimeAgo(`${hours}h ago`);
      else if (minutes > 0) setTimeAgo(`${minutes}m ago`);
      else setTimeAgo(`${seconds < 5 ? 'now' : `${seconds}s ago`}`);
    };

    update();
    const interval = setInterval(update, 5000); // update every 5 seconds
    return () => clearInterval(interval);
  }, [date]);

  return timeAgo;
}

export function OrderCard({ order, onUpdateItemStatus }: OrderCardProps) {
  const timeAgo = useTimeAgo(order.createdAt);
  const isUrgent = (new Date().getTime() - order.createdAt.getTime()) > 10 * 60 * 1000; // > 10 minutes
  const canCollapse = order.items.length > 3;
  const [isOpen, setIsOpen] = useState(!canCollapse);


  return (
    <Card className={cn("flex flex-col border-2 text-base", isUrgent ? "border-red-500/50" : "border-transparent")}>
       <CardHeader className={cn("flex-row items-center justify-between space-y-0 p-3", isUrgent && "bg-red-500/10")}>
        <div>
          <CardTitle className="font-headline text-lg">Order #{order.id}</CardTitle>
          <CardDescription>Table {order.table}</CardDescription>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground font-semibold">
          <Clock className="h-4 w-4" />
          <span>{timeAgo}</span>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        <Separator className="mb-2" />
         <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="space-y-1">
              {order.items.slice(0, 3).map(item => (
                <OrderItem key={item.id} item={item} orderId={order.id} onUpdateItemStatus={onUpdateItemStatus} />
              ))}
          </div>
          <CollapsibleContent className="space-y-1 mt-1">
             {order.items.slice(3).map(item => (
                <OrderItem key={item.id} item={item} orderId={order.id} onUpdateItemStatus={onUpdateItemStatus} />
              ))}
          </CollapsibleContent>
          {canCollapse && (
            <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full h-8 mt-2">
                    <ChevronsUpDown className="h-4 w-4" />
                    <span className="ml-2">{isOpen ? "Show Less" : "Show More"}</span>
                </Button>
            </CollapsibleTrigger>
          )}
        </Collapsible>
      </CardContent>
    </Card>
  )
}