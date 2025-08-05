
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
  New: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-800 dark:text-blue-300',
  Cooking: 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300',
  Ready: 'bg-green-500/10 text-green-800 dark:text-green-300',
};

export function OrderItem({ item, orderId, onUpdateItemStatus, onRevertItemStatus }: OrderItemProps) {
  
  const ItemInfo = ({ count }: { count: number }) => (
    <div className="flex-1 min-w-0">
      <div className="flex items-start gap-1.5">
          <span className="font-bold text-xl leading-tight">{count}x</span>
          <span className="font-semibold text-xl whitespace-normal break-words leading-tight">{item.menuItem.name}</span>
      </div>
      {item.selectedExtras && item.selectedExtras.length > 0 && (
        <div className="pl-6 text-sm text-muted-foreground font-medium">
          {item.selectedExtras.map(extra => (
            <div key={extra.id}>+ {extra.name}</div>
          ))}
        </div>
      )}
      {item.notes && (
          <p className="pl-6 text-sm text-primary/80 font-medium italic whitespace-pre-wrap">Notes: {item.notes}</p>
      )}
    </div>
  );

  const StatusRow = ({ 
      count,
      status, 
      onClick, 
      onRevert, 
      revertTo 
    }: {
      count: number;
      status: 'New' | 'Cooking' | 'Ready',
      onClick?: () => void,
      onRevert?: () => void,
      revertTo?: 'New' | 'Cooking'
  }) => {
    if (count === 0) return null;

    const canRevert = !!onRevert;
    const revertIconColor = status === 'Cooking' ? 'text-yellow-700' : 'text-green-700';

    return (
      <div 
        className={cn(
            "p-1 rounded-md transition-all group", 
            statusColors[status],
            onClick && "cursor-pointer"
        )}
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      >
        <div className="flex justify-between items-center gap-2">
            <ItemInfo count={count} />
            {canRevert && (
              <button
                  onClick={(e) => { e.stopPropagation(); onRevert(); }}
                  className="p-1 -m-1 rounded-full hover:bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Revert to ${revertTo}`}
              >
                  <RotateCcw className={cn("h-4 w-4", revertIconColor)} />
              </button>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
        <StatusRow 
            count={item.newCount}
            status="New"
            onClick={() => onUpdateItemStatus(orderId, item.id, 'New')}
        />
        <StatusRow 
            count={item.cookingCount}
            status="Cooking"
            onClick={() => onUpdateItemStatus(orderId, item.id, 'Cooking')}
            onRevert={() => onRevertItemStatus(orderId, item.id, 'New')}
            revertTo="New"
        />
        <StatusRow 
            count={item.readyCount}
            status="Ready"
            onRevert={() => onRevertItemStatus(orderId, item.id, 'Cooking')}
            revertTo="Cooking"
        />
    </div>
  )
}
