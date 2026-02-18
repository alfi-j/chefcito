"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PayPhonePaymentBox } from "@/components/payphone-payment-box";

interface SubscriptionManagementDialogProps {
  children: React.ReactNode;
}

export function SubscriptionManagementDialog({ children }: SubscriptionManagementDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'inactive' | 'active' | 'pending'>('inactive');


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Manage Subscription</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Current Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Current Status</CardTitle>
              <CardDescription>Your subscription details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="font-medium">Subscription Status:</span>
                <Badge 
                  variant={subscriptionStatus === 'active' ? 'default' : subscriptionStatus === 'pending' ? 'secondary' : 'destructive'}
                >
                  {subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1)}
                </Badge>
              </div>
              {subscriptionStatus === 'active' && (
                <div className="mt-3 text-sm text-muted-foreground">
                  <p>Renews monthly on March 15, 2024</p>
                  <p>Next billing: $9.99 USD</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Payment Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">ChefCito Pro</CardTitle>
              <CardDescription>Unlock premium features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Monthly Subscription</h3>
                  <p className="text-sm text-muted-foreground">$9.99 USD per month</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-500">$9.99</div>
                  <div className="text-sm text-muted-foreground">per month</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Features included:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Advanced reporting dashboard</li>
                  <li>• Priority customer support</li>
                  <li>• Unlimited menu items</li>
                  <li>• Custom branding options</li>
                  <li>• Multi-location management</li>
                </ul>
              </div>

              {subscriptionStatus !== 'active' && (
                <div className="pt-4">
                  <PayPhonePaymentBox 
                    totalAmount={9.99}
                  />
                </div>
              )}

              {subscriptionStatus === 'active' && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setSubscriptionStatus('inactive')}
                >
                  Cancel Subscription
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}