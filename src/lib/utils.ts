import { type Order, type OrderItem, type MenuItem } from "./types"

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ")
}

export const getOrderTotal = (order: Order): number => {
  const subtotal = order.items.reduce((total, item) => {
    const mainItemPrice = item.menuItem.price;
    const extrasPrice = item.selectedExtras?.reduce((acc: number, extra: MenuItem) => acc + extra.price, 0) || 0;
    const totalUnits = (item.quantity || 0);
    return total + (mainItemPrice + extrasPrice) * totalUnits;
  }, 0);
  
  // Calculate tax (8%)
  const tax = subtotal * 0.08;
  
  return subtotal + tax;
};

export const getItemTotal = (item: OrderItem): number => {
  const mainItemPrice = item.menuItem.price;
  const extrasPrice = item.selectedExtras?.reduce((acc: number, extra: MenuItem) => acc + extra.price, 0) || 0;
  const totalUnits = (item.quantity || 0);
  return (mainItemPrice + extrasPrice) * totalUnits;
};

export const getReadyItems = (order: Order) => {
  return order.items.filter(item => item.readyCount > 0);
};