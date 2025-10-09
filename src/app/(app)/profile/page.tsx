"use client"
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/context/i18n-context'
import { toast } from "sonner"
import { Separator } from '@/components/ui/separator'
import { UserInfo } from '@/components/user-info'
import { MembershipManager } from '@/components/membership-manager'
import { RoleManager } from '@/components/role-manager'

export default function ProfilePage() {
  const { t } = useI18n()
  const [name, setName] = useState("Staff Member")
  const email = "staff@chefcito.com" // Typically this would come from user data
  
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleSaveChanges = () => {
    // In a real app, you would send this to your backend API
    toast.success(t('toast.success'), {
      description: t('profile.toast.profile_updated'),
      duration: 3000,
    });
  }
  
  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast.error(t('toast.error'), {
        description: t('profile.toast.password_mismatch'),
        duration: 3000,
      });
      return;
    }
    if (!newPassword || !currentPassword) {
       toast.error(t('toast.error'), {
        description: t('profile.toast.password_empty'),
        duration: 3000,
      });
      return;
    }
    
    // In a real app, you would send this to your backend API
    toast.success(t('toast.success'), {
      description: t('profile.toast.password_updated'),
      duration: 3000,
    });
    
    // Clear fields after submission
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UserInfo />
        <MembershipManager />
      </div>
      
      <RoleManager />
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">{t('profile.account_title')}</CardTitle>
          <CardDescription>{t('profile.account_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('profile.name')}</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t('profile.email')}</Label>
            <Input id="email" type="email" value={email} disabled />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleSaveChanges}>{t('profile.save_button')}</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">{t('profile.password_section_title')}</CardTitle>
          <CardDescription>{t('profile.password_section_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="space-y-2">
            <Label htmlFor="current-password">{t('profile.current_password')}</Label>
            <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">{t('profile.new_password')}</Label>
            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
           <div className="space-y-2">
            <Label htmlFor="confirm-password">{t('profile.confirm_password')}</Label>
            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleChangePassword}>{t('profile.change_password_button')}</Button>
        </CardFooter>
      </Card>
    </div>
  )
}