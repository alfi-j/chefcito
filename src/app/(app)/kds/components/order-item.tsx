
"use client";

import { type OrderItem as OrderItemType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";

interface OrderItemProps {
    item: OrderItemType;
    orderId: number;
    onUpdateItemStatus: (orderId: number, itemId: string) => void;
    onRevertItemStatus: (orderId: number, itemId: string) => void;
}

const statusColors = {
  New: 'bg-blue-500/10 hover:bg-blue-500/20',
  Cooking: 'bg-yellow-500/10 hover:bg-yellow-500/20',
  Cooked: 'bg-green-500/10 cursor-not-allowed',
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
  
  const renderUncookedItem = () => (
    <div 
      className={cn(
        "p-1 rounded-md transition-all cursor-pointer",
        statusColors[item.status]
      )}
      onClick={handleStatusChange}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-1.5 flex-1 min-w-0">
          <span className="font-bold text-xl leading-tight">{item.quantity}x</span>
          <div className="flex-1">
            <span className="font-semibold text-xl whitespace-normal break-words leading-tight">{item.menuItem.name}</span>
            {item.selectedExtras && item.selectedExtras.length > 0 && (
              <div className="pl-2 text-sm text-muted-foreground font-medium">
                {item.selectedExtras.map(extra => (
                  <div key={extra.id}>+ {extra.name}</div>
                ))}
              </div>
            )}
          </div>
        </div>
        <span className="text-lg font-bold ml-1.5 leading-tight">{item.status}</span>
      </div>
    </div>
  );

  const renderCookedItem = () => (
     <div 
        className={cn(
          "p-1 rounded-md transition-all flex justify-between items-center group cursor-pointer",
          'bg-muted/50 text-muted-foreground opacity-60 hover:opacity-100 hover:bg-destructive/10' 
        )}
        onClick={handleRevertStatus}
      >
        <div className="flex items-start gap-1.5 flex-1 min-w-0">
          <span className="font-bold text-xl leading-tight">{item.cookedCount}x</span>
           <div className="flex-1">
            <span className="font-semibold text-xl whitespace-normal break-words line-through leading-tight">{item.menuItem.name}</span>
            {item.selectedExtras && item.selectedExtras.length > 0 && (
               <div className="pl-2 text-sm text-muted-foreground font-medium line-through">
                {item.selectedExtras.map(extra => (
                  <div key={extra.id}>+ {extra.name}</div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold ml-1.5">Cooked</span>
          <RotateCcw className="h-4 w-4 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
  );

  return (
    <>
      {item.quantity > 0 && renderUncookedItem()}
      {item.cookedCount > 0 && renderCookedItem()}
    </>
  )
}
