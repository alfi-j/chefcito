"use client"

import { useNormalizedUserStore } from "@/lib/stores/user-store-normalized";
import { useI18nStore } from '@/lib/stores/i18n-store';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function MembershipManager() {
  const user = useNormalizedUserStore().getCurrentUser();
  const { updateMembership } = useNormalizedUserStore();
  const { t } = useI18nStore();

  if (!user) {
    return null;
  }

  const handleUpgrade = () => {
    updateMembership(user.id, "pro");
    toast.success("Membership Upgraded", {
      description: "You have successfully upgraded to Pro membership!",
      duration: 3000,
    });
  };

  const handleDowngrade = () => {
    updateMembership(user.id, "free");
    toast.success("Membership Updated", {
      description: "You have downgraded to Free membership.",
      duration: 3000,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('profile.membership_title')}</CardTitle>
        <CardDescription>{t('profile.membership_desc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">{t('profile.current_plan')}</h3>
            <p className="text-sm text-muted-foreground">
              {user.membership === "pro" 
                ? t('profile.full_access') 
                : t('profile.limited_access')}
            </p>
          </div>
          <Badge variant={user.membership === "pro" ? "default" : "secondary"}>
            {user.membership.charAt(0).toUpperCase() + user.membership.slice(1)}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {user.membership === "free" ? (
          <Button onClick={handleUpgrade}>{t('profile.upgrade_to_pro')}</Button>
        ) : (
          <Button variant="outline" onClick={handleDowngrade}>{t('profile.downgrade_to_free')}</Button>
        )}
      </CardFooter>
    </Card>
  );
}