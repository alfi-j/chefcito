import { Staff } from "@/lib/types";

export type Feature =
  | "view-orders"
  | "manage-orders"
  | "view-menu"
  | "manage-menu"
  | "view-staff"
  | "manage-staff"
  | "view-analytics"
  | "manage-settings"
  | "access-kds"
  | "access-pos";

export const checkFeatureAccess = (user: Staff, feature: Feature): boolean => {
  // Role-based access control
  switch (user.role) {
    case "Restaurant Owner":
      // Owners have access to everything
      return true;

    case "Admin":
      // Admins have access to everything except some owner-specific settings
      return feature !== "manage-settings";

    case "Staff":
      // Regular staff have limited access
      return ["view-orders", "access-pos"].includes(feature);

    default:
      return false;
  }
};

export const checkMembershipFeatures = (user: Staff, feature: Feature): boolean => {
  // Pro members get additional features
  if (user.membership === "pro") {
    return true;
  }

  // Free members have limited access
  const freeMemberFeatures: Feature[] = [
    "view-orders",
    "view-menu",
    "access-pos",
    "access-kds"
  ];

  return freeMemberFeatures.includes(feature);
};

export const hasAccess = (user: Staff, feature: Feature): boolean => {
  // Check both role-based and membership-based access
  return checkFeatureAccess(user, feature) && checkMembershipFeatures(user, feature);
};