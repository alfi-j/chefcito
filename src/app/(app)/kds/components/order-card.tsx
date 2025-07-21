"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { type Order, type OrderItem as OrderItemType } from "@/lib/data"
import { cn } from "@/lib/utils"
import { Clock, ClipboardList, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react'
import { MdOutlineTableRestaurant } from "react-icons/md";
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"

interface OrderCardProps {
  order: Order
  onUpdateItemStatus: (orderId: number, itemId: string) => void
  onRevertItemStatus: (orderId: number, itemId: string) => void
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

function OrderItem({ item, orderId, onUpdateItemStatus, onRevertItemStatus }: { item: OrderItemType, orderId: number, onUpdateItemStatus: OrderCardProps['onUpdateItemStatus'], onRevertItemStatus: OrderCardProps['onRevertItemStatus'] }) {
  const handleStatusChange = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (item.status === 'Cooked') return;
    onUpdateItemStatus(orderId, item.id);
  };

  const handleRevertStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRevertItemStatus(orderId, item.id);
  }
  
  const isFullyCooked = item.quantity === 0 && item.cookedCount > 0;

  return (
    <>
      {item.quantity > 0 && (
        <div 
          className={cn(
            "p-1 rounded-md transition-all cursor-pointer flex justify-between items-center",
            'bg-card hover:bg-muted/80',
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
      )}
      {item.cookedCount > 0 && (
        <div 
          className={cn(
            "p-1 rounded-md transition-all flex justify-between items-center group cursor-pointer",
            'bg-muted/50 text-muted-foreground opacity-60 hover:opacity-100 hover:bg-destructive/10' 
          )}
          onClick={handleRevertStatus}
        >
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="font-bold text-xl">{item.cookedCount}x</span>
            <span className="font-semibold text-xl whitespace-normal break-words flex-1">{item.menuItem.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold ml-1.5">Cooked</span>
            <RotateCcw className="h-4 w-4 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      )}
    </>
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

export function OrderCard({ order, onUpdateItemStatus, onRevertItemStatus, onMoveOrder, isFirst, isLast }: OrderCardProps) {
  const timeAgo = useTimeAgo(order.createdAt);
  
  const [now, setNow] = useState(new Date().getTime());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date().getTime()), 60000); // Update every minute for urgency check
    return () => clearInterval(interval);
  }, []);

  const elapsedMinutes = (now - order.createdAt.getTime()) / (1000 * 60);
  const isUrgent = elapsedMinutes > 10;
  const isVeryUrgent = elapsedMinutes > 20;

  const sortedItems = useMemo(() => {
    return [...order.items].sort((a, b) => {
      const aIsFullyCooked = a.quantity === 0 && a.cookedCount > 0;
      const bIsFullyCooked = b.quantity === 0 && b.cookedCount > 0;
      if (aIsFullyCooked && !bIsFullyCooked) return 1;
      if (!aIsFullyCooked && bIsFullyCooked) return -1;
      return 0;
    });
  }, [order.items]);

  return (
    <Card className="flex flex-col">
        <CardHeader className={cn("flex-row items-center justify-between space-y-0 p-2", 
            isVeryUrgent && order.status === 'pending' && "bg-destructive/20",
            isUrgent && !isVeryUrgent && order.status === 'pending' && "bg-yellow-500/20"
        )}>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isFirst} onClick={() => onMoveOrder(order.id, 'left')}>
              <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-grow flex justify-center items-center gap-x-2">
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              <span>{order.id}</span>
            </CardTitle>
            <div className="flex items-center gap-1.5 text-lg text-muted-foreground font-semibold">
                <MdOutlineTableRestaurant className="h-5 w-5" />
                <span>{order.table}</span>
            </div>
            <div className="flex items-center gap-1.5 text-lg text-muted-foreground font-semibold">
                <Clock className="h-5 w-5" />
                <span className="whitespace-nowrap">{timeAgo}</span>
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
              <OrderItem key={item.id} item={item} orderId={order.id} onUpdateItemStatus={onUpdateItemStatus} onRevertItemStatus={onRevertItemStatus}/>
            ))}
          </div>
        </div>
    </Card>
  )
}
