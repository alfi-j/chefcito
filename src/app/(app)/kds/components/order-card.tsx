"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { type Order, type OrderItem as OrderItemType } from "@/lib/types"
import { cn } from "@/lib/helpers"
import { formatTimeAgo } from "@/lib/helpers"
import { Clock, ClipboardList, GripVertical, AlertTriangle, Pin, PinOff, StickyNote } from 'lucide-react'
import { MdOutlineTableRestaurant } from "react-icons/md";
import { useState, useEffect, useMemo, type DragEvent } from "react"
import { useI18nStore } from "@/lib/stores/i18n-store"
import { OrderItem } from "./order-item"
import { KDS_STATES } from "@/lib/constants"
import { debugKDS } from "@/lib/helpers"

interface OrderCardProps {
  order: Order
  items: OrderItemType[]; // Now accepts a filtered list of items
  onUpdateItemStatus: (orderId: number, itemId: string, fromStatus: string) => void
  onRevertItemStatus: (orderId: number, itemId: string, toStatus: string) => void
  onDragStart: (e: DragEvent<HTMLDivElement>, orderId: number) => void;
  onDrop: (e: DragEvent<HTMLDivElement>, orderId: number) => void;
  onDragEnter: (e: DragEvent<HTMLDivElement>, orderId: number) => void;
  isDraggingOver: boolean;
  onTogglePin: (orderId: number) => void;
  workstationIndex: number;
  totalWorkstations: number;
  workstationName?: string;
  isLastWorkstation?: boolean;
}

export function OrderCard({ order, items, onUpdateItemStatus, onRevertItemStatus, onDragStart, onDrop, onDragEnter, isDraggingOver, onTogglePin, workstationIndex, totalWorkstations, workstationName, isLastWorkstation }: OrderCardProps) {
  debugKDS('OrderCard rendered:', { 
    orderId: order.id, 
    workstationIndex, 
    totalWorkstations, 
    workstationName,
    itemsCount: items.length,
    items: items.map(i => ({
      id: i.id,
      name: i.menuItem.name,
      status: i.status,
      workstationId: i.workstationId
    }))
  });
  
  // Ensure createdAt is a Date object
  const createdAtDate = useMemo(() => {
    return order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
  }, [order.createdAt]);

  const { language } = useI18nStore();
  const [timeAgo, setTimeAgo] = useState<string>(formatTimeAgo(createdAtDate, language));
  
  const [now, setNow] = useState(new Date().getTime());

  useEffect(() => {
    // Update timeAgo immediately
    setTimeAgo(formatTimeAgo(createdAtDate, language));
    
    // Update timeAgo every minute
    const interval = setInterval(() => {
      setTimeAgo(formatTimeAgo(createdAtDate, language));
      setNow(new Date().getTime());
    }, 60000);
    
    return () => clearInterval(interval);
  }, [createdAtDate, language]);

  const elapsedMinutes = (now - createdAtDate.getTime()) / (1000 * 60);
  const isUrgent = elapsedMinutes > 10;
  const isVeryUrgent = elapsedMinutes > 20;

  const groupedItems = useMemo(() => {
    const groups: { [category: string]: OrderItemType[] } = {};
    const categoryOrder: { [category: string]: number } = {};
    let orderCounter = 0;

    // Sort items by position first
    const sortedItems = [...items].sort((a, b) => {
      // Sort by position if available
      if (a.position !== undefined && b.position !== undefined) {
        return a.position - b.position;
      }
      // If position is not available, sort by creation timestamp or ID
      return a.id.localeCompare(b.id);
    });

    sortedItems.forEach(item => {
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
    debugKDS('handlePinClick called:', { orderId: order.id });
    onTogglePin(order.id);
  }
  
  const currentTab = useMemo(() => {
      // Check if any item has status that indicates it's in kitchen workflow
      if (items.some(i => {
        const normalizedStatus = i.status?.toString().toLowerCase();
        const kdsNew = KDS_STATES.NEW?.toString().toLowerCase();
        const kdsInProgress = KDS_STATES.IN_PROGRESS?.toString().toLowerCase();
        const kdsReady = KDS_STATES.READY?.toString().toLowerCase();
        
        // If the item is assigned to a specific workstation, we need to check that workstation's logic
        // For now, we'll use a simple approach based on status
        return normalizedStatus === kdsNew || 
               normalizedStatus === kdsInProgress ||
               normalizedStatus === 'new' || 
               normalizedStatus === 'in-progress' ||
               normalizedStatus === kdsReady ||
               normalizedStatus === 'ready';
      })) {
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
      onDragEnd={(e) => {
        // Clean up drag state
        e.preventDefault();
      }}
    >
      <Card 
        className={cn(
          "flex flex-col h-full",
          order.isPinned && "border-primary border-2",
        )}
        draggable={!order.isPinned}
      >
          <CardHeader className="flex-row items-center justify-between space-y-0 px-1 py-1">
            <GripVertical className={cn("h-5 w-5 text-muted-foreground", !order.isPinned ? "cursor-grab" : "invisible")} />
            <div className="flex-grow flex flex-col items-center justify-center min-h-[3rem]">
              <div className="flex items-center justify-center gap-4 w-full">
                <CardTitle className="font-headline text-2xl flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  <span>{order.id}</span>
                </CardTitle>
                <div className="flex items-center gap-1.5 text-lg text-muted-foreground font-semibold">
                  <MdOutlineTableRestaurant className="h-5 w-5" />
                  <span>{order.table}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-lg text-muted-foreground font-semibold">
                <Clock className="h-5 w-5" />
                <span className="whitespace-nowrap">{timeAgo}</span>
                {(order.status === 'pending' && isVeryUrgent) || (order.status === 'pending' && isUrgent && !isVeryUrgent) ? (
                  order.status === 'pending' && isVeryUrgent ? (
                    <div className="ml-2 w-5 h-5 rounded-full bg-destructive animate-blink flex items-center justify-center">
                      <AlertTriangle className="h-3 w-3 text-destructive-foreground" />
                    </div>
                  ) : (
                    <div className="ml-2 w-5 h-5 rounded-full bg-yellow-500 animate-blink flex items-center justify-center">
                      <AlertTriangle className="h-3 w-3 text-black" />
                    </div>
                  )
                ) : null}
              </div>
            </div>
            <div className="flex items-center justify-center w-6 h-6">
              <button 
                onClick={handlePinClick} 
                className="p-1 rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {order.isPinned ? (
                  <Pin className="h-5 w-5 text-primary fill-primary" />
                ) : (
                  <PinOff className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
            </div>
          </CardHeader>
          
          <div className="p-1 pt-0 flex-1">
            <Separator className="mb-1" />
            {order.notes && (
                <div className="p-1 mb-1 border-l-4 border-primary bg-primary/10">
                    <div className="flex items-start gap-2">
                        <StickyNote className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-semibold text-primary whitespace-pre-wrap">{order.notes}</p>
                    </div>
                </div>
            )}
            <CardContent className="space-y-1 h-full p-0">
              {orderedCategories.map((category, index) => (
                <div key={category}>
                  {index > 0 && <Separator className="my-1"/>}
                  <h4 className="font-semibold tracking-wide uppercase text-xs text-muted-foreground/80">{category}</h4>
                  <div className="space-y-1 mt-1">
                    {groupedItems[category].map(item => (
                      <OrderItem 
                        key={item.id} 
                        item={item} 
                        orderId={order.id} 
                        currentTab={currentTab}
                        onUpdateItemStatus={onUpdateItemStatus} 
                        onRevertItemStatus={onRevertItemStatus}
                        workstationIndex={workstationIndex}
                        totalWorkstations={totalWorkstations}
                        workstationName={workstationName}
                        isLastWorkstation={isLastWorkstation}
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