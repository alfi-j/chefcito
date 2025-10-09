"use client"

import { useUser } from "@/context/user-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function UserInfo() {
  const { user } = useUser();

  if (!user) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Information</CardTitle>
        <CardDescription>Role and membership details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">Name:</span>
          <span>{user.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">Email:</span>
          <span>{user.email}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">Role:</span>
          <Badge variant={user.role === "Restaurant Owner" ? "default" : user.role === "Admin" ? "secondary" : "outline"}>
            {user.role}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">Membership:</span>
          <Badge variant={user.membership === "pro" ? "default" : "secondary"}>
            {user.membership.charAt(0).toUpperCase() + user.membership.slice(1)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}