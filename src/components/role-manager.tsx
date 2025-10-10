"use client"

import { useUser } from "@/context/user-context";
import { useRoleAccess } from "@/hooks/use-role-access";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export function RoleManager() {
  const { user, updateUserRole } = useUser();
  const { isOwner, isAdmin } = useRoleAccess();

  // Only owners and admins can manage roles
  if (!isOwner && !isAdmin) {
    return null;
  }

  const handleRoleChange = (newRole: 'Owner' | 'Admin' | 'Staff') => {
    updateUserRole(newRole);
    toast.success("Role Updated", {
      description: `Your role has been updated to ${newRole}`,
      duration: 3000,
    });
  };

  if (!user) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Management</CardTitle>
        <CardDescription>Manage your user role</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Change Role</h3>
            <Select value={user.role} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Owner">Owner</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>
              {user.role === "Owner" && "As the restaurant owner, you have full access to all system features."}
              {user.role === "Admin" && "As an admin, you can manage staff and system settings."}
              {user.role === "Staff" && "As a staff member, you have basic access to the system."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}