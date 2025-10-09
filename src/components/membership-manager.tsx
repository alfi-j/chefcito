"use client"

import { useUser } from "@/context/user-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function MembershipManager() {
  const { user, updateMembership } = useUser();

  if (!user) {
    return null;
  }

  const handleUpgrade = () => {
    updateMembership("pro");
    toast.success("Membership Upgraded", {
      description: "You have successfully upgraded to Pro membership!",
      duration: 3000,
    });
  };

  const handleDowngrade = () => {
    updateMembership("free");
    toast.success("Membership Updated", {
      description: "You have downgraded to Free membership.",
      duration: 3000,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Membership</CardTitle>
        <CardDescription>Manage your membership plan</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Current Plan</h3>
            <p className="text-sm text-muted-foreground">
              {user.membership === "pro" 
                ? "Full access to all features" 
                : "Limited access to basic features"}
            </p>
          </div>
          <Badge variant={user.membership === "pro" ? "default" : "secondary"}>
            {user.membership.charAt(0).toUpperCase() + user.membership.slice(1)}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {user.membership === "free" ? (
          <Button onClick={handleUpgrade}>Upgrade to Pro</Button>
        ) : (
          <Button variant="outline" onClick={handleDowngrade}>Downgrade to Free</Button>
        )}
      </CardFooter>
    </Card>
  );
}