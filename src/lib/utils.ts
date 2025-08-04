import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { type Order, type OrderItem } from "./types"

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
