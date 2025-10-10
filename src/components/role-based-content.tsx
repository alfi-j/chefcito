"use client"

import { useRoleAccess } from "@/hooks/use-role-access";

interface RoleBasedContentProps {
  children: React.ReactNode;
  allowedRoles?: 'Owner' | 'Admin' | 'Staff' | ('Owner' | 'Admin' | 'Staff')[];
  allowedMembership?: "free" | "pro";
  fallback?: React.ReactNode;
}

export function RoleBasedContent({
  children,
  allowedRoles,
  allowedMembership,
  fallback = null,
}: RoleBasedContentProps) {
  const { canAccess } = useRoleAccess();

  if (canAccess(allowedRoles, allowedMembership)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}