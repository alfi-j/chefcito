"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { type Order, type OrderItem as OrderItemType } from "@/lib/data"
import { cn } from "@/lib/utils"
import { Clock, ClipboardList } from 'lucide-react'
import { useState, useEffect, useMemo } from "react"

interface OrderCardProps {
  order: Order
  onUpdateItemStatus: (orderId: number, itemId: string, newStatus: 'New' | 'Cooking' | 'Cooked') => void
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
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="font-bold text-base">{item.quantity}x</span>
        <span className="font-semibold text-base whitespace-normal break-words flex-1">{item.menuItem.name}</span>
      </div>
      <span className="text-sm font-bold ml-1.5">{item.status}</span>
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

  const sortedItems = useMemo(() => {
    return [...order.items].sort((a, b) => {
      if (a.status === 'Cooked' && b.status !== 'Cooked') return 1;
      if (a.status !== 'Cooked' && b.status === 'Cooked') return -1;
      return 0;
    });
  }, [order.items]);

  return (
    <Card className={cn("flex flex-col border-2 text-base", isUrgent && order.status === 'pending' ? "border-red-500/50" : "border-transparent")}>
        <CardHeader className={cn("flex-row items-center justify-between space-y-0 p-1.5", isUrgent && order.status === 'pending' && "bg-red-500/10")}>
          <div className="flex items-center gap-2">
            <CardTitle className="font-headline text-2xl flex items-center gap-1.5">
              <ClipboardList className="h-5 w-5" />
              <span>{order.id}</span>
            </CardTitle>
            <CardDescription className="font-semibold pt-0.5 text-base">Table {order.table}</CardDescription>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground font-semibold">
            <Clock className="h-4 w-4" />
            <span>{timeAgo}</span>
          </div>
        </CardHeader>
        
        <div className="px-1.5 pb-1.5">
          <Separator className="my-1.5" />
          <div className="space-y-1">
            {sortedItems.map(item => (
              <OrderItem key={item.id} item={item} orderId={order.id} onUpdateItemStatus={onUpdateItemStatus} />
            ))}
          </div>
        </div>
    </Card>
  )
}
