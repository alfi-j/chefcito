import { type Order, type OrderItem } from '@/lib/types';

export const createOrder = async (orderData: {
  table: number;
  items: OrderItem[];
  notes?: string;
  orderType: 'dine-in' | 'delivery' | 'takeaway';
  deliveryInfo?: any;
}) => {
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...orderData,
        status: 'pending',
        statusHistory: [{ status: 'pending', timestamp: new Date().toISOString() }]
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create order');
    }

    const newOrder = await response.json();
    return newOrder;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};