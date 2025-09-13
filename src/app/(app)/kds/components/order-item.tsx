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