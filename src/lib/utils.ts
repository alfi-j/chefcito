import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { type Order, type OrderItem, type MenuItem } from "@/lib/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely access nested properties of an object without throwing errors
 * @param obj The object to access
 * @param path The path to the property (e.g., "user.profile.name")
 * @param defaultValue The value to return if the property is not found
 * @returns The value at the specified path or the default value
 */
export function safeGet<T>(obj: any, path: string, defaultValue: T): T {
  if (!obj || typeof obj !== 'object') {
    return defaultValue;
  }

  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }
    current = current[key];
  }

  return current !== undefined ? current : defaultValue;
}

/**
 * Check if a value is defined and not null
 * @param value The value to check
 * @returns True if the value is defined and not null, false otherwise
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Safely access an array, returning an empty array if the value is not an array
 * @param value The value to access
 * @returns The array if it exists and is an array, otherwise an empty array
 */
export function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

/**
 * Validate that an order object has all required properties
 * @param order The order object to validate
 * @returns True if the order is valid, false otherwise
 */
export function isValidOrder(order: any): order is Order {
  if (!order) return false;
  
  return (
    typeof order.id === 'number' &&
    Array.isArray(order.items) &&
    typeof order.status === 'string' &&
    (order.createdAt instanceof Date || typeof order.createdAt === 'string') &&
    typeof order.table === 'number'
  );
}

/**
 * Validate that an order item object has all required properties
 * @param item The order item object to validate
 * @returns True if the order item is valid, false otherwise
 */
export function isValidOrderItem(item: any): item is OrderItem {
  if (!item) return false;
  
  return (
    typeof item.id === 'string' &&
    isValidMenuItem(item.menuItem) &&
    typeof item.quantity === 'number' &&
    typeof item.newCount === 'number' &&
    typeof item.cookingCount === 'number' &&
    typeof item.readyCount === 'number' &&
    typeof item.servedCount === 'number'
  );
}

/**
 * Validate that a menu item object has all required properties
 * @param item The menu item object to validate
 * @returns True if the menu item is valid, false otherwise
 */
export function isValidMenuItem(item: any): item is MenuItem {
  if (!item) return false;
  
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.price === 'number' &&
    typeof item.category === 'string'
  );
}

export const getOrderTotal = (order: Order): number => {
  if (!order || !order.items) return 0;
  
  const subtotal = order.items.reduce((total, item) => {
    // Check if menuItem exists
    if (!item || !item.menuItem) return total;
    
    const mainItemPrice = safeGet<number>(item.menuItem, 'price', 0);
    const extrasPrice = item.selectedExtras?.reduce((acc: number, extra: MenuItem) => {
      // Check if extra exists and has price
      if (!extra) return acc;
      return acc + safeGet<number>(extra, 'price', 0);
    }, 0) || 0;
    const totalUnits = safeGet<number>(item, 'quantity', 0);
    return total + (mainItemPrice + extrasPrice) * totalUnits;
  }, 0);
  
  // Calculate tax (8%)
  const tax = subtotal * 0.08;
  
  return subtotal + tax;
};

export const getItemTotal = (item: OrderItem): number => {
  // Check if menuItem exists
  if (!item || !item.menuItem) return 0;
  
  const mainItemPrice = safeGet<number>(item.menuItem, 'price', 0);
  const extrasPrice = item.selectedExtras?.reduce((acc: number, extra: MenuItem) => {
    // Check if extra exists and has price
    if (!extra) return acc;
    return acc + safeGet<number>(extra, 'price', 0);
  }, 0) || 0;
  const totalUnits = safeGet<number>(item, 'quantity', 0);
  return (mainItemPrice + extrasPrice) * totalUnits;
};

export const getReadyItems = (order: Order) => {
  if (!order || !order.items) return [];
  return order.items.filter(item => item.readyCount > 0);
};