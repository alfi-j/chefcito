"use client";

import { useEffect, useSyncExternalStore, useState } from "react";
import { useTranslation } from "react-i18next";
import { OrderCard } from "@/components/kds/order-card";
import type { Order, OrderItem } from "@/lib/types";

type DemoItem = OrderItem & { animate?: boolean };

type DemoOrder = Omit<Order, "items"> & { items: DemoItem[] };

const MENU = {
  churrasco: { id: "mi-churrasco", name: "Churrasco", price: 8.5, category: "Grill", imageUrl: "", sortIndex: 0 },
  chuleta: { id: "mi-chuleta", name: "Chuleta de cerdo", price: 7.5, category: "Grill", imageUrl: "", sortIndex: 1 },
  papas: { id: "mi-papas", name: "Papas fritas", price: 2.5, category: "Sides", imageUrl: "", sortIndex: 2 },
  encocado: { id: "mi-encocado", name: "Encocado de pescado", price: 9.0, category: "Pescado", imageUrl: "", sortIndex: 0 },
  aguacate: { id: "mi-aguacate", name: "Aguacate", price: 1.0, category: "Extras", imageUrl: "", sortIndex: 1 },
  llapingachos: { id: "mi-llapingachos", name: "Llapingachos + huevo", price: 5.0, category: "Breakfast", imageUrl: "", sortIndex: 0 },
  cafe: { id: "mi-cafe", name: "Café", price: 1.5, category: "Breakfast", imageUrl: "", sortIndex: 1 },
} as const;

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000);

const BASE_ORDERS: DemoOrder[] = [
  {
    id: 127,
    orderNumber: 127,
    restaurantId: "demo",
    status: "pending",
    createdAt: minutesAgo(2),
    table: 4,
    isPinned: true,
    orderType: "dine-in",
    items: [
      {
        id: "o127-1",
        menuItem: MENU.churrasco,
        quantity: 2,
        status: "New",
        workstationId: "ws-grill",
        position: 0,
        selectedExtras: [MENU.aguacate],
        animate: true,
      },
      {
        id: "o127-2",
        menuItem: MENU.chuleta,
        quantity: 1,
        status: "In Progress",
        workstationId: "ws-grill",
        position: 1,
        animate: true,
      },
      {
        id: "o127-3",
        menuItem: MENU.papas,
        quantity: 2,
        status: "New",
        workstationId: "ws-grill",
        position: 2,
        animate: true,
      },
    ],
  },
  {
    id: 129,
    orderNumber: 129,
    restaurantId: "demo",
    status: "pending",
    createdAt: minutesAgo(14),
    table: 7,
    orderType: "dine-in",
    notes: "Sin cebolla",
    items: [
      {
        id: "o129-1",
        menuItem: MENU.encocado,
        quantity: 1,
        status: "New",
        workstationId: "ws-grill",
        position: 0,
        animate: false,
      },
    ],
  },
  {
    id: 130,
    orderNumber: 130,
    restaurantId: "demo",
    status: "pending",
    createdAt: minutesAgo(1),
    table: 12,
    orderType: "dine-in",
    items: [
      {
        id: "o130-1",
        menuItem: MENU.llapingachos,
        quantity: 2,
        status: "New",
        workstationId: "ws-grill",
        position: 0,
        animate: true,
      },
      {
        id: "o130-2",
        menuItem: MENU.cafe,
        quantity: 1,
        status: "In Progress",
        workstationId: "ws-grill",
        position: 1,
        animate: true,
      },
    ],
  },
];

const nextStatus = (status: string) => (status === "New" ? "In Progress" : "New");

const emptySubscribe = () => () => {};

// Static value computed once at module load (dates are module-scope constants).
const LONGEST_WAIT_MINUTES = Math.max(
  ...BASE_ORDERS.map((order) =>
    Math.max(1, Math.round((Date.now() - order.createdAt.getTime()) / 60_000))
  )
);

export function TicketBoard() {
  const { t } = useTranslation();
  // Client-only gate: keeps the server output deterministic (skeletons) and
  // defers rendering the real OrderCard until the client is ready to hydrate.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [orders, setOrders] = useState<DemoOrder[]>(() =>
    BASE_ORDERS.map((order) => ({
      ...order,
      items: order.items.map((item) => ({ ...item })),
    }))
  );

  useEffect(() => {
    if (!mounted) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setInterval(() => {
      setOrders((prev) =>
        prev.map((order) => ({
          ...order,
          items: order.items.map((item) => ({
            ...item,
            status: item.animate ? nextStatus(item.status) : item.status,
          })),
        }))
      );
    }, 2200);

    return () => clearInterval(timer);
  }, [mounted]);

  const onUpdateItemStatus = (orderId: number, itemId: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id !== orderId
          ? order
          : {
              ...order,
              items: order.items.map((item) =>
                item.id !== itemId ? item : { ...item, status: nextStatus(item.status) }
              ),
            }
      )
    );
  };

  const onRevertItemStatus = (orderId: number, itemId: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id !== orderId
          ? order
          : {
              ...order,
              items: order.items.map((item) =>
                item.id !== itemId ? item : { ...item, status: "New" }
              ),
            }
      )
    );
  };

  const onTogglePin = (orderId: number) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id !== orderId ? order : { ...order, isPinned: !order.isPinned }
      )
    );
  };

  const longestWaitMinutes = LONGEST_WAIT_MINUTES;

  return (
    <div className="overflow-hidden rounded-xl border border-[#E9E0CC] bg-[#FFFDF8] shadow-[0_24px_48px_-28px_rgba(32,29,21,0.5)]">
      {/* Window bar */}
      <div className="flex items-center justify-between gap-3 border-b border-[#E9E0CC] bg-[#F4EEDF] px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#F5B48C]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#F2D27A]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#9CC39B]" />
        </div>
        <p className="font-headline text-xs font-semibold uppercase tracking-[0.18em] text-[#6B6354]">
          {t("landing.ticket.window")}
        </p>
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#1B6B3A]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1B6B3A] opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1B6B3A]" />
          </span>
          {t("landing.ticket.live")}
        </span>
      </div>

      {/* Tickets — real KDS OrderCard, mounted client-side for hydration safety */}
      <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
        {!mounted
          ? Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="flex h-40 animate-pulse flex-col gap-2 rounded-lg border border-[#E9E0CC] bg-[#F4EEDF]/60 p-3"
              >
                <div className="h-4 w-24 rounded bg-[#EADFC8]" />
                <div className="h-3 w-16 rounded bg-[#EADFC8]" />
                <div className="mt-2 h-3 w-full rounded bg-[#EADFC8]" />
                <div className="h-3 w-4/5 rounded bg-[#EADFC8]" />
              </div>
            ))
          : orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                items={order.items}
                onUpdateItemStatus={onUpdateItemStatus}
                onRevertItemStatus={onRevertItemStatus}
                onDragStart={(e, orderId) => {
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", String(orderId));
                }}
                onDrop={(e) => e.preventDefault()}
                onDragEnter={(e) => e.preventDefault()}
                onDragLeave={(e) => e.preventDefault()}
                onDragEnd={() => {}}
                isDraggingOver={false}
                onTogglePin={onTogglePin}
                workstationIndex={0}
                totalWorkstations={3}
                workstationName="Grill"
                isLastWorkstation={false}
              />
            ))}
      </div>

      {/* Board footer */}
      <div className="flex items-center justify-between border-t border-[#E9E0CC] bg-[#F4EEDF] px-4 py-2 text-xs font-medium text-[#5C554A]">
        <span>{t("landing.ticket.orders", { count: orders.length })}</span>
        <span>{t("landing.ticket.longest", { minutes: longestWaitMinutes })}</span>
      </div>
    </div>
  );
}