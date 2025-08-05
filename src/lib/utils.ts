import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { type Order, type OrderItem, type ReadyItem } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const getOrderTotal = (order: Order) => {
    return order.items.reduce((total, item) => {
        const extrasTotal = item.selectedExtras?.reduce((acc, extra) => acc + extra.price, 0) || 0;
        const totalUnits = (item.cookedCount || 0) + (item.quantity || 0);
        const mainItemPrice = item.menuItem.price + extrasTotal;
        return total + (mainItemPrice * totalUnits);
    }, 0);
};

export const getItemTotal = (item: OrderItem) => {
    const extrasPrice = item.selectedExtras?.reduce((acc, extra) => acc + extra.price, 0) || 0;
    const totalUnits = (item.cookedCount || 0) + (item.quantity || 0);
    return (item.menuItem.price + extrasPrice) * totalUnits;
};

export const groupReadyItemsByTable = (orders: Order[]): Record<string, ReadyItem[]> => {
  const readyItemsByTable: Record<string, ReadyItem[]> = {};

  orders
    .filter(order => order.status === 'pending') // Only look at pending orders
    .forEach(order => {
      order.items.forEach(item => {
        // Find items that have been cooked
        if (item.cookedCount > 0) {
          if (!readyItemsByTable[order.table]) {
            readyItemsByTable[order.table] = [];
          }
          
          // Create a distinct entry for each cooked unit
          for (let i = 0; i < item.cookedCount; i++) {
            // A simple unique ID for each unit, to be used as a key
            const uniqueId = `${item.id}-${i}`; 
            
            // Check if this specific unit is already in the list to avoid duplicates
            if (!readyItemsByTable[order.table].some(readyItem => readyItem.id === uniqueId)) {
                readyItemsByTable[order.table].push({
                  id: uniqueId,
                  name: item.menuItem.name,
                  orderId: order.id,
                  table: order.table,
                  orderItemId: item.id,
                  selectedExtras: item.selectedExtras || [],
                  notes: item.notes
                });
            }
          }
        }
      });
    });
  
  return readyItemsByTable;
};
