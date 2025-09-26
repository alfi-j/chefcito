
"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { type Order, type OrderItem as OrderItemType } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Clock, ClipboardList, GripVertical, AlertTriangle, Pin, PinOff, StickyNote } from 'lucide-react'
import { MdOutlineTableRestaurant } from "react-icons/md";
import { useState, useEffect, useMemo, type DragEvent } from "react"
import { useTimeAgo } from "@/hooks/use-time-ago"
import { OrderItem } from "./order-item"

interface OrderCardProps {
  order: Order
  items: OrderItemType[]; // Now accepts a filtered list of items
  onUpdateItemStatus: (orderId: number, itemId: string, fromStatus: 'New' | 'Cooking' | 'Serve') => void
  onRevertItemStatus: (orderId: number, itemId: string, toStatus: 'New' | 'Cooking' | 'Serve') => void
  onDragStart: (e: DragEvent<HTMLDivElement>, orderId: number) => void;
  onDrop: (e: DragEvent<HTMLDivElement>, orderId: number) => void;
  onDragEnter: (e: DragEvent<HTMLDivElement>, orderId: number) => void;
  isDraggingOver: boolean;
  onTogglePin: (orderId: number) => void;
}

export function OrderCard({ order, items, onUpdateItemStatus, onRevertItemStatus, onDragStart, onDrop, onDragEnter, isDraggingOver, onTogglePin }: OrderCardProps) {
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
    const groups: { [category: string]: OrderItemType[] } = {};
    const categoryOrder: { [category: string]: number } = {};
    let orderCounter = 0;

    items.forEach(item => {
      const category = item.menuItem.category;
      if (!groups[category]) {
        groups[category] = [];
        categoryOrder[category] = orderCounter++;
      }
      groups[category].push(item);
    });

    // Sort categories based on their appearance in the original order
    const sortedCategories = Object.keys(groups).sort((a, b) => categoryOrder[a] - categoryOrder[b]);

    // Create a sorted group object
    const sortedGroups: { [category: string]: OrderItemType[] } = {};
    for (const category of sortedCategories) {
        sortedGroups[category] = groups[category];
    }
    
    return sortedGroups;
  }, [items]);
  
  const orderedCategories = useMemo(() => {
    return Object.keys(groupedItems);
  }, [groupedItems]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessary to allow dropping
  };
  
  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePin(order.id);
  }
  
  const currentTab = useMemo(() => {
      if (items.some(i => i.newCount > 0 || i.cookingCount > 0)) {
          return 'kitchen';
      }
      return 'serving';
  }, [items]);

  return (
    <div 
      className={cn(
        "relative rounded-lg w-full p-1",
        isDraggingOver && "animate-marching-ants"
      )}
      onDragStart={(e) => onDragStart(e, order.id)}
      onDrop={(e) => onDrop(e, order.id)}
      onDragOver={handleDragOver}
      onDragEnter={(e) => onDragEnter(e, order.id)}
    >
      <Card 
        className={cn(
          "flex flex-col h-full",
          order.isPinned && "border-primary border-2",
        )}
        draggable={!order.isPinned}
      >
          <CardHeader className="flex-row items-center justify-between space-y-0 p-2">
            <GripVertical className={cn("h-5 w-5 text-muted-foreground", !order.isPinned ? "cursor-grab" : "invisible")} />
            <div className="flex-grow flex flex-wrap justify-center items-center gap-x-2 gap-y-1">
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
             <button onClick={handlePinClick} className="p-1 rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring">
              {order.isPinned ? (
                <Pin className="h-5 w-5 text-primary fill-primary" />
              ) : (
                <PinOff className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          </CardHeader>
          
          <div className="p-1 pt-0 flex-1">
            <Separator className="mb-1" />
            {order.notes && (
                <div className="p-2 mb-1 border-l-4 border-primary bg-primary/10">
                    <div className="flex items-start gap-2">
                        <StickyNote className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-semibold text-primary whitespace-pre-wrap">{order.notes}</p>
                    </div>
                </div>
            )}
            <CardContent className="space-y-1 h-full p-0">
              {orderedCategories.map((category, index) => (
                <div key={category}>
                  {index > 0 && <Separator className="my-2"/>}
                  <h4 className="font-semibold tracking-wide uppercase text-xs px-1 text-muted-foreground/80">{category}</h4>
                  <div className="space-y-1 mt-1">
                    {groupedItems[category].map(item => (
                      <OrderItem 
                        key={item.id} 
                        item={item} 
                        orderId={order.id} 
                        currentTab={currentTab}
                        onUpdateItemStatus={onUpdateItemStatus} 
                        onRevertItemStatus={onRevertItemStatus}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </div>
      </Card>
    </div>
  )
}
