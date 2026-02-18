"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useI18nStore } from '@/lib/stores/i18n-store'
import { UserInfo } from "@/components/user-info"
import { SubscriptionManagementDialog } from "@/components/subscription-management-dialog"
import { RoleManager } from "@/components/role-manager"

export default function ProfilePage() {
    const { t } = useI18nStore();
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-headline font-bold">{t('profile.title')}</h1>
                <p className="text-muted-foreground">{t('profile.description')}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('profile.personal_info')}</CardTitle>
                        <CardDescription>{t('profile.personal_info_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('profile.name')}</Label>
                            <Input id="name" defaultValue="John Doe" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">{t('profile.email')}</Label>
                            <Input id="email" type="email" defaultValue="john@example.com" />
                        </div>
                        <Button>{t('profile.save_button')}</Button>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <UserInfo />
                    <div className="flex flex-col gap-4">
                      <SubscriptionManagementDialog>
                        <Button variant="outline" className="w-full">
                          Manage Subscription
                        </Button>
                      </SubscriptionManagementDialog>
                      <RoleManager />
                    </div>
                </div>
            </div>

            <Separator />

            <Card>
                <CardHeader>
                    <CardTitle>{t('profile.logout')}</CardTitle>
                    <CardDescription>{t('profile.logout_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="destructive">{t('profile.logout_button')}</Button>
                </CardContent>
            </Card>
        </div>
    )
}