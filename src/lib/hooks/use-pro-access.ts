"use client";

import { useCallback, useEffect, useState } from 'react';
import { useUserStore } from '@/lib/stores/user-store';

export interface ProAccess {
  isPro: boolean;
  loading: boolean;
  /** The latest active/pending subscription, if any */
  subscription: {
    _id: string;
    status: string;
    plan: string;
    endDate?: string;
    clientTransactionId?: string;
  } | null;
}

interface SubscriptionResponse {
  hasSubscription: boolean;
  subscription?: {
    _id: string;
    status: string;
    plan: string;
    endDate?: string;
    clientTransactionId?: string;
  };
}

/**
 * Resolves whether the current user's restaurant has Pro access.
 *
 * Source of truth is the server: it reads the restaurant's membership and
 * re-validates the subscription on every call (expired subscriptions
 * downgrade the restaurant automatically). The result is also synced back
 * into the user store so nav / layout gating stays consistent.
 */
export function useProAccess(): ProAccess {
  const user = useUserStore((s) => s.getCurrentUser());
  const restaurantId = user?.restaurantId ?? null;
  const updateRestaurantMembership = useUserStore((s) => s.updateRestaurantMembership);

  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<ProAccess['subscription']>(null);

  const refresh = useCallback(async () => {
    if (!restaurantId) {
      setLoading(false);
      setIsPro(false);
      setSubscription(null);
      return;
    }

    setLoading(true);
    try {
      const [subResponse, restaurantResponse] = await Promise.all([        fetch(`/api/subscriptions?restaurantId=${encodeURIComponent(restaurantId)}`),
        fetch(`/api/restaurants/${encodeURIComponent(restaurantId)}`),
      ]);

      const subData = subResponse.ok
        ? ((await subResponse.json()) as SubscriptionResponse)
        : null;
      const restaurantData = restaurantResponse.ok ? await restaurantResponse.json() : null;

      const membership = restaurantData?.membership === 'pro';
      const activeSub =
        subData?.hasSubscription &&
        subData.subscription &&
        subData.subscription.status === 'active';
      const notExpired =
        !subData?.subscription?.endDate ||
        new Date(subData.subscription.endDate).getTime() >= Date.now();

      const pro = Boolean(membership && activeSub && notExpired);

      setIsPro(pro);
      setSubscription(
        subData?.subscription ? { ...subData.subscription } : null
      );
      // Keep the client user object in sync so gating primitives that read
      // user.restaurantMembership (nav, layouts) reflect the server state.
      updateRestaurantMembership(restaurantId, pro ? 'pro' : 'free');
    } catch (error) {
      console.error('Error resolving Pro access:', error);
      setIsPro(false);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, updateRestaurantMembership]);

  useEffect(() => {
    const id = setTimeout(() => {
      void refresh();
    }, 0);
    return () => clearTimeout(id);
  }, [refresh]);

  return { isPro, loading, subscription };
}