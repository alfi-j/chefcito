
"use client";

import { type OrderItem as OrderItemType } from "@/lib/data";
import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";

interface OrderItemProps {
    item: OrderItemType;
    orderId: number;
    onUpdateItemStatus: (orderId: number, itemId: string) => void;
    onRevertItemStatus: (orderId: number, itemId: string) => void;
}

const statusColors = {
  New: 'bg-blue-500/10',
  Cooking: 'bg-yellow-500/10',
  Cooked: 'bg-green-500/10',
};

export function OrderItem({ item, orderId, onUpdateItemStatus, onRevertItemStatus }: OrderItemProps) {
  const handleStatusChange = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (item.status === 'Cooked') return;
    onUpdateItemStatus(orderId, item.id);
  };

  const handleRevertStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRevertItemStatus(orderId, item.id);
  }
  
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
