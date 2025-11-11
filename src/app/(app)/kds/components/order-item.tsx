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
    workstationIndex: number;
    totalWorkstations: number;
    workstationName?: string;
}

const statusColors: Record<string, string> = {
  [KDS_STATES.NEW]: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-800 dark:text-blue-300',
  [KDS_STATES.IN_PROGRESS]: 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300',
  [KDS_STATES.READY]: 'bg-green-500/10 text-green-800 dark:text-green-300 hover:bg-green-500/20',
};

export function OrderItem({ item, orderId, currentTab, onUpdateItemStatus, onRevertItemStatus, workstationIndex, totalWorkstations, workstationName }: OrderItemProps) {

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
                    })} />
                </button>
              )}
            </div>
        </div>
      </div>
    );
  }

  // Get current state index
  const getCurrentStateIndex = (status: string | undefined): number => {
    if (!status) return -1;
    
    // Normalize the status for comparison
    const normalizedStatus = status.toString().toLowerCase();
    const kdsNew = KDS_STATES.NEW?.toString().toLowerCase();
    const kdsInProgress = KDS_STATES.IN_PROGRESS?.toString().toLowerCase();
    const kdsReady = KDS_STATES.READY?.toString().toLowerCase();
    
    if (normalizedStatus === kdsNew || normalizedStatus === 'new') return 0;
    if (normalizedStatus === kdsInProgress || normalizedStatus === 'in-progress') return 1;
    if (normalizedStatus === kdsReady || normalizedStatus === 'ready') return 2;
    
    // Default to New state if unrecognized
    return 0;
  };

  const currentStateIndex = getCurrentStateIndex(item.status);
  
  // Check if this is the last workstation or a "Completed" workstation
  const isCompletedWorkstation = workstationIndex === totalWorkstations - 1 || workstationName === 'Completed';
  
  return (
    <div className="space-y-1">
      {/* For all workstations except the last one, show only New and In Progress states */}
      {!isCompletedWorkstation && currentTab === 'kitchen' && (currentStateIndex === 0 || currentStateIndex === 1) && (
        <>
          {currentStateIndex === 0 && (
            <StatusRow 
                status={KDS_STATES.NEW}
                onClick={() => onUpdateItemStatus(orderId, item.id, KDS_STATES.NEW)}
            />
          )}
          {currentStateIndex === 1 && (
            <StatusRow 
                status={KDS_STATES.IN_PROGRESS}
                onClick={() => onUpdateItemStatus(orderId, item.id, KDS_STATES.IN_PROGRESS)}
                onRevert={() => onRevertItemStatus(orderId, item.id, KDS_STATES.NEW)}
            />
          )}
        </>
      )}
      
      {/* For the last workstation (Completed), show only Ready and Served states */}
      {isCompletedWorkstation && (
        <>
          {(currentStateIndex === 2 || item.status?.toString().toLowerCase() === 'ready') && (
            <StatusRow 
                status={KDS_STATES.READY}
                onClick={() => onUpdateItemStatus(orderId, item.id, KDS_STATES.READY)}
                onRevert={() => onRevertItemStatus(orderId, item.id, KDS_STATES.IN_PROGRESS)}
            />
          )}
          {item.status === 'served' && (
            <StatusRow 
                status={'Served'}
                onRevert={() => onRevertItemStatus(orderId, item.id, KDS_STATES.READY)}
            />
          )}
        </>
      )}
      
      {/* Fallback for any items that don't match the above conditions */}
      {!isCompletedWorkstation && currentTab === 'kitchen' && currentStateIndex !== 0 && currentStateIndex !== 1 && currentStateIndex !== -1 && (
        <StatusRow 
            status={item.status || KDS_STATES.NEW}
            onClick={() => onUpdateItemStatus(orderId, item.id, item.status || KDS_STATES.NEW)}
        />
      )}
      
      {/* Add a fallback for serving tab as well */}
      {!isCompletedWorkstation && currentTab === 'serving' && currentStateIndex !== 2 && currentStateIndex !== -1 && (
        <StatusRow 
            status={item.status || KDS_STATES.NEW}
            onClick={() => onUpdateItemStatus(orderId, item.id, item.status || KDS_STATES.NEW)}
        />
      )}
      
      {/* Handle case where status is undefined or unrecognized */}
      {currentStateIndex === -1 && (
        <StatusRow 
            status={KDS_STATES.NEW}
            onClick={() => onUpdateItemStatus(orderId, item.id, KDS_STATES.NEW)}
        />
      )}
    </div>
  )
}