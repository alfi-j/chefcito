
"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { type Order, type OrderItem as OrderItemType, menuCategories } from "@/lib/data"
import { cn } from "@/lib/utils"
import { Clock, ClipboardList, GripVertical, AlertTriangle } from 'lucide-react'
import { MdOutlineTableRestaurant } from "react-icons/md";
import { useState, useEffect, useMemo, type DragEvent } from "react"
import { useTimeAgo } from "@/hooks/use-time-ago"
import { OrderItem } from "./order-item"

interface OrderCardProps {
  order: Order
  onUpdateItemStatus: (orderId: number, itemId: string) => void
  onRevertItemStatus: (orderId: number, itemId: string) => void
  onDragStart: (e: DragEvent<HTMLDivElement>, orderId: number) => void;
  onDrop: (e: DragEvent<HTMLDivElement>, orderId: number) => void;
  onDragEnter: (e: DragEvent<HTMLDivElement>, orderId: number) => void;
  onDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  isDraggingOver: boolean;
}

export function OrderCard({ order, onUpdateItemStatus, onRevertItemStatus, onDragStart, onDrop, onDragEnter, onDragLeave, isDraggingOver }: OrderCardProps) {
  const timeAgo = useTimeAgo(order.createdAt);
  
  const [now, setNow] = useState(new Date().getTime());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date().getTime()), 60000); // Update every minute for urgency check
    return () => clearInterval(interval);
  }, []);

  const elapsedMinutes = (now - order.createdAt.getTime()) / (1000 * 60);
  const isUrgent = elapsedMinutes > 10;
  const isVeryUrgent = elapsedMinutes > 20;

  const groupedItems = useMemo(() => {
    const groups: Record<string, OrderItemType[]> = {};
    
    // Group items by category
    for (const item of order.items) {
      const category = item.menuItem.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    }
    
    // Sort items within each group (uncooked first)
    for (const category in groups) {
      groups[category].sort((a, b) => {
        const aIsFullyCooked = a.quantity === 0 && a.cookedCount > 0;
        const bIsFullyCooked = b.quantity === 0 && b.cookedCount > 0;
        if (aIsFullyCooked && !bIsFullyCooked) return 1;
        if (!aIsFullyCooked && bIsFullyCooked) return -1;
        return 0;
      });
    }

    return groups;
  }, [order.items]);

  const orderedCategories = useMemo(() => {
    return menuCategories.filter(cat => groupedItems[cat]);
  }, [groupedItems]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  return (
    <Card 
      className={cn(
        "flex flex-col cursor-grab mb-2",
        isDraggingOver && "border-2 border-dashed border-primary"
      )}
      draggable={order.status === 'pending'}
      onDragStart={(e) => onDragStart(e, order.id)}
      onDrop={(e) => onDrop(e, order.id)}
      onDragOver={handleDragOver}
      onDragEnter={(e) => onDragEnter(e, order.id)}
      onDragLeave={onDragLeave}
    >
        <CardHeader className="flex-row items-center justify-between space-y-0 p-2">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
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
                {order.status === 'pending' && isVeryUrgent && (
                  <div className="w-6 h-6 rounded-full bg-destructive animate-blink flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-destructive-foreground" />
                  </div>
                )}
                {order.status === 'pending' && isUrgent && !isVeryUrgent && (
                   <div className="w-6 h-6 rounded-full bg-yellow-500 animate-blink flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-black" />
                   </div>
                )}
            </div>
          </div>
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
        </CardHeader>
        
        <div className="p-1 pt-0">
          <Separator className="mb-1" />
          <div className="space-y-1">
            {orderedCategories.map((category, index) => (
              <div key={category}>
                {index > 0 && <Separator className="my-2"/>}
                <h4 className="font-bold text-sm px-1 text-muted-foreground">{category}</h4>
                <div className="space-y-1 mt-1">
                  {groupedItems[category].map(item => (
                    <OrderItem key={item.id} item={item} orderId={order.id} onUpdateItemStatus={onUpdateItemStatus} onRevertItemStatus={onRevertItemStatus}/>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
    </Card>
  )
}
