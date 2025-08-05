
"use client";

import { type OrderItem as OrderItemType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";

interface OrderItemProps {
    item: OrderItemType;
    orderId: number;
    onUpdateItemStatus: (orderId: number, itemId: string, fromStatus: 'New' | 'Cooking') => void;
    onRevertItemStatus: (orderId: number, itemId: string, toStatus: 'New' | 'Cooking') => void;
}

const statusColors = {
  New: 'bg-blue-500/10 hover:bg-blue-500/20',
  Cooking: 'bg-yellow-500/10 hover:bg-yellow-500/20',
  Ready: 'bg-green-500/10',
};

export function OrderItem({ item, orderId, onUpdateItemStatus, onRevertItemStatus }: OrderItemProps) {
  
  const ItemInfo = () => (
    <div className="flex-1">
      <span className="font-semibold text-xl whitespace-normal break-words leading-tight">{item.menuItem.name}</span>
      {item.selectedExtras && item.selectedExtras.length > 0 && (
        <div className="pl-2 text-sm text-muted-foreground font-medium">
          {item.selectedExtras.map(extra => (
            <div key={extra.id}>+ {extra.name}</div>
          ))}
        </div>
      )}
      {item.notes && (
          <p className="pl-2 text-sm text-primary/80 font-medium italic whitespace-pre-wrap">Notes: {item.notes}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-1">
        {/* NEW ITEMS */}
        {item.newCount > 0 && (
             <div 
                className={cn("p-1 rounded-md transition-all cursor-pointer", statusColors.New)}
                onClick={(e) => { e.stopPropagation(); onUpdateItemStatus(orderId, item.id, 'New'); }}
            >
                <div className="flex justify-between items-start">
                    <div className="flex items-start gap-1.5 flex-1 min-w-0">
                        <span className="font-bold text-xl leading-tight">{item.newCount}x</span>
                        <ItemInfo />
                    </div>
                </div>
            </div>
        )}

         {/* COOKING ITEMS */}
        {item.cookingCount > 0 && (
             <div 
                className={cn("p-1 rounded-md transition-all cursor-pointer group", statusColors.Cooking)}
                onClick={(e) => { e.stopPropagation(); onUpdateItemStatus(orderId, item.id, 'Cooking'); }}
            >
                <div className="flex justify-between items-start">
                    <div className="flex items-start gap-1.5 flex-1 min-w-0">
                        <span className="font-bold text-xl leading-tight">{item.cookingCount}x</span>
                        <ItemInfo />
                    </div>
                     <button
                        onClick={(e) => { e.stopPropagation(); onRevertItemStatus(orderId, item.id, 'New'); }}
                        className="p-1 -m-1 rounded-full hover:bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <RotateCcw className="h-4 w-4 text-yellow-700" />
                    </button>
                </div>
            </div>
        )}
        
        {/* READY ITEMS */}
        {item.readyCount > 0 && (
             <div 
                className={cn("p-1 rounded-md transition-all group", statusColors.Ready)}
            >
                <div className="flex justify-between items-start">
                    <div className="flex items-start gap-1.5 flex-1 min-w-0">
                        <span className="font-bold text-xl leading-tight">{item.readyCount}x</span>
                         <ItemInfo />
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onRevertItemStatus(orderId, item.id, 'Cooking'); }}
                        className="p-1 -m-1 rounded-full hover:bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <RotateCcw className="h-4 w-4 text-green-700" />
                    </button>
                </div>
            </div>
        )}
    </div>
  )
}
