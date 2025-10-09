"use client"

import { useRoleAccess, Role } from "@/hooks/use-role-access";

interface RoleBasedContentProps {
  children: React.ReactNode;
  allowedRoles?: Role | Role[];
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