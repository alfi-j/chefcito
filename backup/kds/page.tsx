
"use client";
import { useState, useMemo, type DragEvent } from "react";
import { OrderCard } from "./components/order-card";
import { type Order, type OrderItem } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card";
import { useI18n } from "@/context/i18n-context";
import { useOrders } from "@/hooks/use-orders";


export default function KdsPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [draggedOrderId, setDraggedOrderId] = useState<number | null>(null);
  const [dragOverOrderId, setDragOverOrderId] = useState<number | null>(null);
  const { t } = useI18n();
  
  const { 
    orders, 
    loading, 
    updateItemStatus, 
    revertItemStatus, 
    toggleOrderPin
  } = useOrders();
}
