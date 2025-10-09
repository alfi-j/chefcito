import { useUser } from "@/context/user-context";

export type Role = "Restaurant Owner" | "Admin" | "Staff";

export const useRoleAccess = () => {
  const { user } = useUser();

  const hasRole = (roles: Role | Role[]): boolean => {
    if (!user) return false;
    
    if (Array.isArray(roles)) {
      return roles.includes(user.role as Role);
    }
    
    return user.role === roles;
  };

  const hasMembership = (membership: "free" | "pro"): boolean => {
    if (!user) return false;
    return user.membership === membership;
  };

  const canAccess = (requiredRole?: Role | Role[], requiredMembership?: "free" | "pro"): boolean => {
    // If no requirements, allow access
    if (!requiredRole && !requiredMembership) return true;
    
    // Check role requirements
    const roleCheck = requiredRole ? hasRole(requiredRole) : true;
    
    // Check membership requirements
    const membershipCheck = requiredMembership ? hasMembership(requiredMembership) : true;
    
    return roleCheck && membershipCheck;
  };

  // Specific role checks
  const isOwner = hasRole("Restaurant Owner");
  const isAdmin = hasRole("Admin");
  const isStaff = hasRole("Staff");

  // Membership checks
  const isProMember = hasMembership("pro");
  const isFreeMember = hasMembership("free");

  return {
    user,
    hasRole,
    hasMembership,
    canAccess,
    isOwner,
    isAdmin,
    isStaff,
    isProMember,
    isFreeMember,
  };
};