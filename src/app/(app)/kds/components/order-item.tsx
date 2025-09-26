"use client";

import { type Order, type OrderItem as OrderItemType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";

interface OrderItemProps {
    item: OrderItemType;
    orderId: number;
    currentTab: 'kitchen' | 'serving';
    onUpdateItemStatus: (orderId: number, itemId: string, fromStatus: 'New' | 'Cooking' | 'Serve') => void;
    onRevertItemStatus: (orderId: number, itemId: string, toStatus: 'New' | 'Cooking' | 'Serve') => void;
}

const statusColors = {
  New: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-800 dark:text-blue-300',
  Cooking: 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300',
  Serve: 'bg-green-500/10 text-green-800 dark:text-green-300 hover:bg-green-500/20',
  Served: 'bg-gray-500/10 text-gray-800 dark:text-gray-300 hover:bg-gray-500/20',
};

export function OrderItem({ item, orderId, currentTab, onUpdateItemStatus, onRevertItemStatus }: OrderItemProps) {

  const ItemInfo = ({ count }: { count: number }) => (
    <div className="flex-1 min-w-0">
      <div className="flex items-start gap-1.5">
          <span className="font-bold text-xl leading-tight">{count}x</span>
          {/* Handle cases where menuItem might be null */}
          <span className="font-semibold text-xl whitespace-normal break-words leading-tight">
            {item.menuItem?.name || 'Unknown Item'}
          </span>
          <span className="font-semibold text-xl whitespace-normal break-words leading-tight ml-auto">
            {/* Handle cases where menuItem might be null */}
            ${((item.menuItem?.price || 0) * count).toFixed(2)}
          </span>
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
    }: {
      count: number;
      status: 'New' | 'Cooking' | 'Serve' | 'Served',
      onClick?: () => void,
      onRevert?: () => void,
  }) => {
    if (count === 0) return null;

    const canRevert = !!onRevert;
    
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
            <div className="flex items-center gap-2">
              <div className="font-bold text-xs uppercase w-16 text-center shrink-0">{status}</div>
              {canRevert && (
                <button
                    onClick={(e) => { e.stopPropagation(); onRevert(); }}
                    className="p-1 -m-1 rounded-full hover:bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Revert status`}
                >
                    <RotateCcw className={cn("h-4 w-4", {
                        "text-yellow-700": status === 'Cooking',
                        "text-green-700": status === 'Serve',
                        "text-gray-700": status === 'Served'
                    })} />
                </button>
              )}
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {currentTab === 'kitchen' && (
        <>
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
          />
        </>
      )}
      {currentTab === 'serving' && (
         <>
          <StatusRow 
              count={item.readyCount}
              status="Serve"
              onClick={() => onUpdateItemStatus(orderId, item.id, 'Serve')}
              onRevert={() => onRevertItemStatus(orderId, item.id, 'Cooking')}
          />
          <StatusRow 
              count={item.servedCount}
              status="Served"
              onRevert={() => onRevertItemStatus(orderId, item.id, 'Serve')}
          />
         </>
      )}
    </div>
  )
}