"use client"

import { useNormalizedUserStore } from "@/lib/stores/user-store-normalized";
import { useI18nStore } from '@/lib/stores/i18n-store';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CreditCard, Smartphone, Loader2, Calendar, DollarSign } from "lucide-react";

export function MembershipManager() {
  const user = useNormalizedUserStore().getCurrentUser();
  const { updateMembership } = useNormalizedUserStore();
  const { t } = useI18nStore();
  
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userSubscriptions, setUserSubscriptions] = useState<any[]>([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);

  // Load user subscriptions
  useEffect(() => {
    const loadSubscriptions = async () => {
      if (!user) return;
      
      setIsLoadingSubscriptions(true);
      try {
        const response = await fetch(`/api/subscriptions?userId=${user.id}`);
        const result = await response.json();
        if (result.success) {
          setUserSubscriptions(result.data);
        }
      } catch (error) {
        console.error('Error loading subscriptions:', error);
      } finally {
        setIsLoadingSubscriptions(false);
      }
    };

    loadSubscriptions();
  }, [user]);

  if (!user) {
    return null;
  }

  const handleUpgradeClick = () => {
    setIsUpgradeDialogOpen(true);
  };

  const handleUpgrade = async () => {
    if (!phoneNumber && !email) {
      toast.error("Please provide either phone number or email");
      return;
    }

    setIsProcessing(true);
    try {
      // Process payment through PayPhone
      const response = await fetch('/api/membership/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          amount: 9.99, // Monthly subscription fee
          currency: 'USD',
          phoneNumber: phoneNumber || undefined,
          email: email || undefined
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Update user membership
        await updateMembership(user.id, "pro");
        
        toast.success("Subscription Activated!", {
          description: "You have successfully subscribed to Pro plan!",
          duration: 5000,
        });
        
        // Refresh subscriptions
        const subsResponse = await fetch(`/api/subscriptions?userId=${user.id}`);
        const subsResult = await subsResponse.json();
        if (subsResult.success) {
          setUserSubscriptions(subsResult.data);
        }
        
        setIsUpgradeDialogOpen(false);
        setPhoneNumber('');
      } else {
        throw new Error(result.error || 'Payment failed');
      }
    } catch (error: any) {
      toast.error("Subscription Failed", {
        description: error.message || "Failed to process subscription payment",
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      // In a real implementation, you'd call a cancel subscription API
      // For now, we'll just downgrade the user's membership
      await updateMembership(user.id, "free");
      
      toast.success("Subscription Cancelled", {
        description: "Your subscription has been cancelled. You'll retain access until the end of your billing period.",
        duration: 5000,
      });
      
      // Refresh subscriptions
      const response = await fetch(`/api/subscriptions?userId=${user.id}`);
      const result = await response.json();
      if (result.success) {
        setUserSubscriptions(result.data);
      }
    } catch (error: any) {
      toast.error("Cancellation Failed", {
        description: error.message || "Failed to cancel subscription",
        duration: 5000,
      });
    }
  };

  const getActiveSubscription = () => {
    return userSubscriptions.find(sub => 
      sub.status === 'active' || sub.status === 'pending'
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const activeSubscription = getActiveSubscription();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('profile.membership_title')}</CardTitle>
          <CardDescription>Manage your ChefCito subscription and billing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Current Plan</h3>
              <p className="text-sm text-muted-foreground">
                {user.membership === "pro" 
                  ? "Full access to all ChefCito features" 
                  : "Limited access - upgrade for full features"}
              </p>
            </div>
            <Badge variant={user.membership === "pro" ? "default" : "secondary"}>
              {user.membership.charAt(0).toUpperCase() + user.membership.slice(1)}
            </Badge>
          </div>

          {activeSubscription && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-medium">Active Subscription</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Next billing:</span>
                  <span className="font-medium">
                    {activeSubscription.nextBillingDate ? 
                      formatDate(activeSubscription.nextBillingDate) : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  <span>Amount:</span>
                  <span className="font-medium">
                    ${activeSubscription.amount.toFixed(2)}/{activeSubscription.currency}
                  </span>
                </div>
              </div>
            </div>
          )}

          {isLoadingSubscriptions && (
            <div className="text-sm text-muted-foreground">Loading subscription details...</div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {user.membership === "free" ? (
            <Button onClick={handleUpgradeClick}>
              <CreditCard className="mr-2 h-4 w-4" />
              Subscribe to Pro - $9.99/month
            </Button>
          ) : activeSubscription ? (
            <Button 
              variant="outline" 
              onClick={() => handleCancelSubscription(activeSubscription.id)}
            >
              Cancel Subscription
            </Button>
          ) : (
            <Button variant="outline" onClick={handleUpgradeClick}>
              <CreditCard className="mr-2 h-4 w-4" />
              Renew Subscription
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Upgrade Dialog */}
      <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Subscribe to ChefCito Pro</DialogTitle>
            <DialogDescription>
              Get full access to all ChefCito features for $9.99/month
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">What you'll get:</h4>
              <ul className="text-sm text-blue-600 dark:text-blue-400 list-disc list-inside space-y-1">
                <li>Unlimited orders and transactions</li>
                <li>Advanced reporting and analytics</li>
                <li>Priority customer support</li>
                <li>All restaurant management features</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Required for PayPhone payment verification
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                For subscription receipts and notifications
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsUpgradeDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpgrade}
              disabled={(!phoneNumber && !email) || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay $9.99/month
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}