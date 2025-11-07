"use client";

import { type Order, type OrderItem as OrderItemType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";
import { KDS_STATES } from "@/lib/kds-constants";

interface OrderItemProps {
    item: OrderItemType;
    orderId: number;
    currentTab: 'kitchen' | 'serving';
    onUpdateItemStatus: (orderId: number, itemId: string, fromStatus: string) => void;
    onRevertItemStatus: (orderId: number, itemId: string, toStatus: string) => void;
}

const statusColors: Record<string, string> = {
  [KDS_STATES.NEW]: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-800 dark:text-blue-300',
  [KDS_STATES.IN_PROGRESS]: 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300',
  [KDS_STATES.READY]: 'bg-green-500/10 text-green-800 dark:text-green-300 hover:bg-green-500/20',
  'Served': 'bg-gray-500/10 text-gray-800 dark:text-gray-300 hover:bg-gray-500/20',
};

export function OrderItem({ item, orderId, currentTab, onUpdateItemStatus, onRevertItemStatus }: OrderItemProps) {

  const ItemInfo = () => (
    <div className="flex-1 min-w-0">
      <div className="flex items-start gap-1.5">
          <span className="font-bold text-xl leading-tight">{item.quantity}x</span>
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
      status, 
      onClick, 
      onRevert, 
    }: {
      status: string,
      onClick?: () => void,
      onRevert?: () => void,
  }) => {
    const canRevert = !!onRevert;
    
    return (
      <div 
        className={cn(
            "p-1 rounded-md transition-all group", 
            statusColors[status] || 'bg-muted',
            onClick && "cursor-pointer"
        )}
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      >
        <div className="flex justify-between items-center gap-2">
            <ItemInfo />
            <div className="flex items-center gap-2">
              <div className="font-bold text-xs uppercase w-16 text-center shrink-0">{status}</div>
              {canRevert && (
                <button
                    onClick={(e) => { e.stopPropagation(); onRevert(); }}
                    className="p-1 -m-1 rounded-full hover:bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Revert status`}
                >
                    <RotateCcw className={cn("h-4 w-4", {
                        "text-yellow-700": status === KDS_STATES.IN_PROGRESS,
                        "text-green-700": status === KDS_STATES.READY,
                        "text-gray-700": status === 'Served'
                    })} />
                </button>
              )}
            </div>
        </div>
      </div>
    );
  }

  // Normalize status for comparison
  const normalizedStatus = item.status?.toString().toLowerCase();
  const kdsNew = KDS_STATES.NEW?.toString().toLowerCase();
  const kdsInProgress = KDS_STATES.IN_PROGRESS?.toString().toLowerCase();
  const kdsReady = KDS_STATES.READY?.toString().toLowerCase();
  
  return (
    <div className="space-y-1">
      {currentTab === 'kitchen' && normalizedStatus === kdsNew && (
        <StatusRow 
            status={KDS_STATES.NEW}
            onClick={() => onUpdateItemStatus(orderId, item.id, KDS_STATES.NEW)}
        />
      )}
      {currentTab === 'kitchen' && normalizedStatus === kdsInProgress && (
        <StatusRow 
            status={KDS_STATES.IN_PROGRESS}
            onClick={() => onUpdateItemStatus(orderId, item.id, KDS_STATES.IN_PROGRESS)}
            onRevert={() => onRevertItemStatus(orderId, item.id, KDS_STATES.NEW)}
        />
      )}
      {currentTab === 'serving' && normalizedStatus === kdsReady && (
        <StatusRow 
            status={KDS_STATES.READY}
            onClick={() => onUpdateItemStatus(orderId, item.id, KDS_STATES.READY)}
            onRevert={() => onRevertItemStatus(orderId, item.id, KDS_STATES.IN_PROGRESS)}
        />
      )}
      {normalizedStatus === 'served' && (
        <StatusRow 
            status="Served"
            onRevert={() => onRevertItemStatus(orderId, item.id, KDS_STATES.READY)}
        />
      )}
      {/* Fallback for any items that don't match the above conditions */}
      {currentTab === 'kitchen' && normalizedStatus !== kdsNew && normalizedStatus !== kdsInProgress && normalizedStatus !== 'served' && (
        <StatusRow 
            status={item.status || 'Unknown'}
            onClick={() => onUpdateItemStatus(orderId, item.id, item.status || '')}
        />
      )}
      {/* Add a fallback for serving tab as well */}
      {currentTab === 'serving' && normalizedStatus !== kdsReady && normalizedStatus !== 'served' && (
        <StatusRow 
            status={item.status || 'Unknown'}
            onClick={() => onUpdateItemStatus(orderId, item.id, item.status || '')}
        />
      )}
    </div>
  )
}