import { NextResponse } from 'next/server';
import { getInitialOrders, getPaymentMethods } from '@/lib/database-service';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { type DateRange } from 'react-day-picker';
import { type MenuItem, type Order, type OrderItem, type Payment, type OrderStatusUpdate } from '@/lib/types';

type ReportOrder = Order & {
  customerName?: string;
  paymentMethod?: string;
};

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

function createApiResponse<T>(data?: T, error?: string): ApiResponse<T> {
  return {
    success: !error,
    data,
    error,
    timestamp: new Date().toISOString()
  };
}

const getOrderTotal = (order: ReportOrder): number => {
  return (order.items || []).reduce((total: number, item: OrderItem) => {
    return total + (item.menuItem.price * item.quantity);
  }, 0);
};

function filterOrdersByDateRange(orders: ReportOrder[], dateRange?: DateRange) {
  if (!dateRange || !dateRange.from) return orders;

  const from = dateRange.from;
  const to = dateRange.to || new Date();

  return orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= from && orderDate <= to;
  });
}

// Basic summary (daily + totals)
function generateSummary(orders: ReportOrder[]) {
  const totalRevenue = orders.reduce((sum, order) => sum + getOrderTotal(order), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const dailySalesMap: { [key: string]: number } = {};

  orders.forEach(order => {
    const dateStr = format(new Date(order.createdAt), 'yyyy-MM-dd');
    dailySalesMap[dateStr] = (dailySalesMap[dateStr] || 0) + getOrderTotal(order);
  });

  const dailySales = Object.entries(dailySalesMap)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    totalOrders,
    avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
    dailySales
  };
}

// One row per order/transaction
function generateTransactions(orders: ReportOrder[]) {
  return orders.map(order => {
    const total = getOrderTotal(order);
    return {
      id: order.id,
      date: new Date(order.createdAt).toISOString(),
      table: order.table ?? '',
      customerName: order.customerName ?? '',
      seller: order.staffName ?? '',
      orderType: order.orderType ?? 'dine-in',
      itemsCount: (order.items || []).reduce((sum: number, item: OrderItem) => sum + item.quantity, 0),
      total: parseFloat(total.toFixed(2)),
      paymentMethod: order.paymentMethod ?? null
    };
  });
}

// Group transactions by seller
function generateSellers(orders: ReportOrder[]) {
  const map: Record<string, { seller: string; orders: number; revenue: number }> = {};

  orders.forEach(order => {
    const seller = order.staffName || '—';
    if (!map[seller]) {
      map[seller] = { seller, orders: 0, revenue: 0 };
    }
    map[seller].orders += 1;
    map[seller].revenue += getOrderTotal(order);
  });

  return Object.values(map)
    .map(row => ({
      seller: row.seller,
      orders: row.orders,
      revenue: parseFloat(row.revenue.toFixed(2)),
      avgOrderValue: row.orders > 0 ? parseFloat((row.revenue / row.orders).toFixed(2)) : 0
    }))
    .sort((a, b) => b.orders - a.orders);
}

// Aggregate revenue per item
function generateItems(orders: ReportOrder[]) {
  const itemStats: { [key: string]: { name: string; quantity: number; revenue: number } } = {};

  orders.forEach(order => {
    (order.items || []).forEach((item: OrderItem) => {
      const menuItem = item.menuItem as MenuItem;
      const itemId = menuItem.id;
      const quantity = item.quantity;
      const itemRevenue = menuItem.price * quantity;

      if (itemStats[itemId]) {
        itemStats[itemId].quantity += quantity;
        itemStats[itemId].revenue += itemRevenue;
      } else {
        itemStats[itemId] = { name: menuItem.name, quantity, revenue: itemRevenue };
      }
    });
  });

  const items = Object.values(itemStats);
  const bestSelling = [...items].sort((a, b) => b.quantity - a.quantity);
  const leastSelling = [...items].sort((a, b) => a.quantity - b.quantity);

  return {
    bestSelling: bestSelling.map(item => ({ ...item, revenue: parseFloat(item.revenue.toFixed(2)) })),
    leastSelling: leastSelling.map(item => ({ ...item, revenue: parseFloat(item.revenue.toFixed(2)) }))
  };
}

// Aggregate revenue by payment method. Orders without an explicit method fall back to the
// restaurant's primary enabled method (or 'Cash').
function generatePayments(orders: ReportOrder[], paymentMethods: Payment[]) {
  const primaryMethod =
    paymentMethods.find(m => m.enabled)?.name ||
    'Cash';

  const map: Record<string, { method: string; orders: number; revenue: number }> = {};

  orders.forEach(order => {
    const method = order.paymentMethod || primaryMethod;
    if (!map[method]) {
      map[method] = { method, orders: 0, revenue: 0 };
    }
    map[method].orders += 1;
    map[method].revenue += getOrderTotal(order);
  });

  const rows = Object.values(map).map(row => ({
    method: row.method,
    orders: row.orders,
    revenue: parseFloat(row.revenue.toFixed(2)),
    share: 0
  }));

  const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  rows.forEach(row => {
    row.share = totalRevenue > 0 ? parseFloat(((row.revenue / totalRevenue) * 100).toFixed(2)) : 0;
  });

  return rows.sort((a, b) => b.revenue - a.revenue);
}

function generateKitchen(orders: ReportOrder[]) {
  let totalPrepTime = 0;
  let completedItems = 0;

  orders.forEach(order => {
    if (order.statusHistory) {
      const createdEvent = order.statusHistory.find((event: OrderStatusUpdate) => event.status === 'pending');
      const completedEvent = order.statusHistory.find((event: OrderStatusUpdate) => event.status === 'completed');

      if (createdEvent && completedEvent) {
        const prepTime = differenceInMinutes(
          new Date(completedEvent.timestamp),
          new Date(createdEvent.timestamp)
        );
        if (prepTime > 0) {
          totalPrepTime += prepTime;
          completedItems += order.items.length;
        }
      }
    }
  });

  const itemDelays: Record<string, { name: string; totalTime: number; count: number }> = {};

  orders.forEach(order => {
    if (order.statusHistory) {
      const createdEvent = order.statusHistory.find((event: OrderStatusUpdate) => event.status === 'pending');
      const completedEvent = order.statusHistory.find((event: OrderStatusUpdate) => event.status === 'completed');

      if (createdEvent && completedEvent) {
        const prepTime = differenceInMinutes(
          new Date(completedEvent.timestamp),
          new Date(createdEvent.timestamp)
        );
        if (prepTime > 0) {
          (order.items || []).forEach((item: OrderItem) => {
            const itemId = item.menuItem.id;
            if (!itemDelays[itemId]) {
              itemDelays[itemId] = { name: item.menuItem.name, totalTime: 0, count: 0 };
            }
            itemDelays[itemId].totalTime += prepTime;
            itemDelays[itemId].count += 1;
          });
        }
      }
    }
  });

  const delayedItems = Object.values(itemDelays)
    .map(item => ({
      name: item.name,
      avgTime: item.count > 0 ? item.totalTime / item.count : 0
    }))
    .sort((a, b) => b.avgTime - a.avgTime)
    .slice(0, 10);

  return {
    avgPrepTime: parseFloat((completedItems > 0 ? totalPrepTime / completedItems : 0).toFixed(2)),
    mostDelayed: delayedItems.map(item => ({ ...item, avgTime: parseFloat(item.avgTime.toFixed(2)) }))
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json(
        createApiResponse(undefined, 'restaurantId is required'),
        { status: 400 }
      );
    }

    let dateRange: DateRange | undefined;
    if (from) {
      dateRange = {
        from: parseISO(from),
        to: to ? parseISO(to) : undefined
      };
    }

    const [allOrders, paymentMethods] = await Promise.all([
      getInitialOrders(restaurantId),
      getPaymentMethods(restaurantId),
    ]);

    const filteredOrders = filterOrdersByDateRange(allOrders, dateRange);

    const reports = {
      summary: generateSummary(filteredOrders),
      transactions: generateTransactions(filteredOrders),
      sellers: generateSellers(filteredOrders),
      items: generateItems(filteredOrders),
      payments: generatePayments(filteredOrders, paymentMethods),
      kitchen: generateKitchen(filteredOrders),
    };

    return NextResponse.json(createApiResponse(reports), { status: 200 });
  } catch (error: unknown) {
    console.error('Error generating reports:', error);
    return NextResponse.json(
      createApiResponse(undefined, 'Failed to generate reports'),
      { status: 500 }
    );
  }
}