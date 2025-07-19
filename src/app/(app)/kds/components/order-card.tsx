"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { type Order, type OrderItem as OrderItemType } from "@/lib/data"
import { cn } from "@/lib/utils"
import { Clock, ClipboardList, ArrowLeft, ArrowRight } from 'lucide-react'
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"

interface OrderCardProps {
  order: Order
  onUpdateItemStatus: (orderId: number, itemId: string, newStatus: 'New' | 'Cooking' | 'Cooked') => void
  onMoveOrder: (orderId: number, direction: 'left' | 'right') => void
  isFirst: boolean
  isLast: boolean
}

const statusColors = {
  New: 'bg-blue-500/10 border-l-4 border-blue-500',
  Cooking: 'bg-yellow-500/10 border-l-4 border-yellow-500',
  Cooked: 'bg-green-500/10',
};

const statusSequence: ('New' | 'Cooking' | 'Cooked')[] = ['New', 'Cooking', 'Cooked'];

function OrderItem({ item, orderId, onUpdateItemStatus }: { item: OrderItemType, orderId: number, onUpdateItemStatus: OrderCardProps['onUpdateItemStatus'] }) {
  const handleStatusChange = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    const currentIndex = statusSequence.indexOf(item.status);
    const nextIndex = (currentIndex + 1) % statusSequence.length;
    onUpdateItemStatus(orderId, item.id, statusSequence[nextIndex]);
  };
  
  return (
    <div 
      className={cn(
        "p-1 rounded-md transition-all cursor-pointer flex justify-between items-center",
        item.status === 'Cooked' 
          ? 'bg-muted/50 text-muted-foreground opacity-60' 
          : 'bg-card hover:bg-muted/80',
        statusColors[item.status]
      )}
      onClick={handleStatusChange}
    >
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span className="font-bold text-xl">{item.quantity}x</span>
        <span className="font-semibold text-xl whitespace-normal break-words flex-1">{item.menuItem.name}</span>
      </div>
      <span className="text-lg font-bold ml-1.5">{item.status}</span>
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

export function OrderCard({ order, onUpdateItemStatus, onMoveOrder, isFirst, isLast }: OrderCardProps) {
  const timeAgo = useTimeAgo(order.createdAt);
  const isUrgent = (new Date().getTime() - order.createdAt.getTime()) > 10 * 60 * 1000; // > 10 minutes

  const sortedItems = useMemo(() => {
    return [...order.items].sort((a, b) => {
      if (a.status === 'Cooked' && b.status !== 'Cooked') return 1;
      if (a.status !== 'Cooked' && b.status === 'Cooked') return -1;
      return 0;
    });
  }, [order.items]);

  return (
    <Card className={cn("flex flex-col border-2", isUrgent && order.status === 'pending' ? "border-red-500/50" : "border-transparent")}>
        <CardHeader className={cn("flex-row items-center justify-between space-y-0 p-2", isUrgent && order.status === 'pending' && "bg-red-500/10")}>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isFirst} onClick={() => onMoveOrder(order.id, 'left')}>
              <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col items-center">
            <CardTitle className="font-headline text-3xl flex items-center gap-2">
              <ClipboardList className="h-6 w-6" />
              <span>{order.id}</span>
            </CardTitle>
            <CardDescription className="font-semibold pt-1 text-xl">Table {order.table}</CardDescription>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-lg text-muted-foreground font-semibold">
                <Clock className="h-5 w-5" />
                <span>{timeAgo}</span>
            </div>
          </div>
           <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isLast} onClick={() => onMoveOrder(order.id, 'right')}>
              <ArrowRight className="h-5 w-5" />
          </Button>
        </CardHeader>
        
        <div className="p-1 pt-0">
          <Separator className="mb-1" />
          <div className="space-y-1">
            {sortedItems.map(item => (
              <OrderItem key={item.id} item={item} orderId={order.id} onUpdateItemStatus={onUpdateItemStatus} />
            ))}
          </div>
        </div>
    </Card>
  )
}
