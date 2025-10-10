import { useUser } from "@/context/user-context";

export const useRoleAccess = () => {
  const { user } = useUser();

  const hasRole = (roles: 'Owner' | 'Admin' | 'Staff' | ('Owner' | 'Admin' | 'Staff')[]): boolean => {
    if (!user) return false;
    
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    
    return user.role === roles;
  };

  const hasMembership = (membership: "free" | "pro"): boolean => {
    if (!user) return false;
    return user.membership === membership;
  };

  const canAccess = (requiredRole?: 'Owner' | 'Admin' | 'Staff' | ('Owner' | 'Admin' | 'Staff')[], requiredMembership?: "free" | "pro"): boolean => {
    // If no requirements, allow access
    if (!requiredRole && !requiredMembership) return true;
    
    // Check role requirements
    const roleCheck = requiredRole ? hasRole(requiredRole) : true;
    
    // Check membership requirements
    const membershipCheck = requiredMembership ? hasMembership(requiredMembership) : true;
    
    return roleCheck && membershipCheck;
  };

  // Specific role checks
  const isOwner = hasRole("Owner");
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