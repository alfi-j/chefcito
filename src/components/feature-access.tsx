"use client"

import { useNormalizedUserStore } from "@/lib/stores/user-store-normalized";
import { hasAccess, Feature, User } from "@/lib/constants";

interface FeatureAccessProps {
  feature: Feature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureAccess({
  feature,
  children,
  fallback = null,
}: FeatureAccessProps) {
  const user = useNormalizedUserStore().getCurrentUser();

  if (!user) {
    return <>{fallback}</>;
  }

  if (hasAccess(user, feature)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}