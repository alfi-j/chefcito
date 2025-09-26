<<<<<<< HEAD
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { type MenuItem } from "@/lib/types";

interface OrderItemProps {
  item: any; // TODO: Fix this type
  status: 'New' | 'Cooking' | 'Ready' | 'Served';
  orderId: number;
  count: number;
  onUpdateStatus: (itemId: string, action: 'increase' | 'decrease') => void;
  onRevertStatus: (itemId: string, fromStatus: 'New' | 'Cooking' | 'Ready' | 'Served') => void;
  onDragStart: (e: React.DragEvent) => void;
  t: (key: string) => string;
}

const statusColors = {
  'New': 'bg-blue-100 text-blue-800',
  'Cooking': 'bg-yellow-100 text-yellow-800',
  'Ready': 'bg-green-100 text-green-800',
  'Served': 'bg-gray-100 text-gray-800',
} as const;

const OrderItem: React.FC<OrderItemProps> = ({ 
  item, 
  status, 
  orderId,
  count, 
  onUpdateStatus, 
  onRevertStatus, 
  onDragStart,
  t
}) => {
  return (
    <div 
      className={cn(
        "p-3 rounded-lg border transition-colors",
        statusColors[status]
      )}
      draggable
      onDragStart={onDragStart}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium">{item.menuItem.name}</div>
          {item.selectedExtras && item.selectedExtras.length > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              {item.selectedExtras.map((extra: MenuItem) => extra.name).join(', ')}
            </div>
          )}
          {item.notes && (
            <div className="text-xs text-muted-foreground mt-1">
              {t('kds.order_item.notes')}: {item.notes}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8"
            onClick={() => onRevertStatus(item.id, status)}
            disabled={status === 'New' || status === 'Served'}
          >
            <RotateCcw className={`h-4 w-4 ${
              status === 'Cooking' ? 'text-yellow-700' : 
              status === 'Ready' ? 'text-green-700' : 
              'text-gray-700'
            }`} />
          </Button>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-2">
        <div className="flex items-center space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="h-6 px-2 text-xs"
            onClick={() => onUpdateStatus(item.id, 'decrease')}
            disabled={status === 'Served'}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="text-sm font-medium min-w-[20px] text-center">
            {count}
          </span>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-6 px-2 text-xs"
            onClick={() => onUpdateStatus(item.id, 'increase')}
            disabled={status === 'Served'}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        
        <Badge 
          variant={
            status === 'New' ? 'default' : 
            status === 'Cooking' ? 'secondary' : 
            status === 'Ready' ? 'default' : 
            'outline'
          }
          className="text-xs"
        >
          {t(`kds.order_item.status.${status.toLowerCase()}`)}
        </Badge>
      </div>
    </div>
  );
};

export default OrderItem;
=======
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
>>>>>>> d3399ff (Chefcito Beta!)
