"use client"

import { useNormalizedUserStore } from "@/lib/stores/user-store-normalized";

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
  const user = useNormalizedUserStore().getCurrentUser();
  
  // If no roles specified, allow access
  if (!allowedRoles) return <>{children}</>;
  
  // If no user, deny access
  if (!user) return <>{fallback}</>;
  
  // Check role access
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const hasRoleAccess = rolesArray.includes(user.role as 'Owner' | 'Admin' | 'Staff');
  
  // Check membership access
  const hasMembershipAccess = !allowedMembership || user.membership === allowedMembership;
  
  if (hasRoleAccess && hasMembershipAccess) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}