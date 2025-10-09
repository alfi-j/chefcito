"use client"

import { useUser } from "@/context/user-context";
import { hasAccess, Feature } from "@/lib/access-control";

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
  const { user } = useUser();

  if (!user) {
    return <>{fallback}</>;
  }

  if (hasAccess(user, feature)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}