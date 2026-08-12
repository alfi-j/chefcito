"use client"

import React, { useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslation } from 'react-i18next'
import { useUsersStore } from '@/lib/stores/users-store'
import { toast } from "sonner"

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'On Shift' | 'Off Shift' | 'On Break';
}

interface UserFormData {
  name: string;
  email: string;
  role: string;
  status: 'On Shift' | 'Off Shift' | 'On Break';
  password?: string;
}

interface UserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSave: (userData: UserFormData) => Promise<void>;
  onClose: () => void;
}

export function UserDialog({ 
  isOpen, 
  onOpenChange, 
  user, 
  onSave,
  onClose
}: UserDialogProps) {
  const { t } = useTranslation()
  const formName = useUsersStore((state) => state.getFormName())
  const formEmail = useUsersStore((state) => state.getFormEmail())
  const formPassword = useUsersStore((state) => state.getFormPassword())
  const formConfirmPassword = useUsersStore((state) => state.getFormConfirmPassword())
  const formRole = useUsersStore((state) => state.getFormRole())
  const formStatus = useUsersStore((state) => state.getFormStatus())
  const loading = useUsersStore((state) => state.loading)
  const rolesRecord = useUsersStore((state) => state.entities.roles)
  const resetForm = useUsersStore((state) => state.resetForm)
  const clearForm = useUsersStore((state) => state.clearForm)
  const getFormErrors = useUsersStore((state) => state.getFormErrors)
  const setLoading = useUsersStore((state) => state.setLoading)
  const setFormName = useUsersStore((state) => state.setFormName)
  const setFormEmail = useUsersStore((state) => state.setFormEmail)
  const setFormPassword = useUsersStore((state) => state.setFormPassword)
  const setFormConfirmPassword = useUsersStore((state) => state.setFormConfirmPassword)
  const setFormRole = useUsersStore((state) => state.setFormRole)
  const setFormStatus = useUsersStore((state) => state.setFormStatus)

  const roles = useMemo(() => Object.values(rolesRecord), [rolesRecord])

  // Reset form when dialog opens/closes or the edited user changes.
  useEffect(() => {
    if (isOpen) {
      resetForm(!!user, user)
    } else {
      clearForm()
    }
  }, [isOpen, user, resetForm, clearForm])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation using store validation
    const errors = getFormErrors()
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error))
      return
    }
    
    // Additional password validations
    if (!user && (!formPassword || formPassword.length < 6)) {
      toast.error(t('restaurant.users.errors.password_length'))
      return
    }
    
    if (formPassword !== formConfirmPassword) {
      toast.error(t('restaurant.users.errors.password_mismatch'))
      return
    }
    
    try {
      setLoading(true)
      
      const userData = {
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        role: formRole,
        status: formStatus,
        ...(formPassword && { password: formPassword })
      }
      
      await onSave(userData)
      clearForm()
    } catch (error) {
      console.error('Error saving user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open)
    if (!open) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {user ? t('restaurant.users.dialog.edit_title') : t('restaurant.users.dialog.add_title')}
          </DialogTitle>
          <DialogDescription>
            {user 
              ? t('restaurant.users.dialog.edit_description') 
              : t('restaurant.users.dialog.add_description')}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                {t('restaurant.users.dialog.name')}
              </Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="col-span-3"
                placeholder={t('restaurant.users.dialog.name_placeholder')}
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                {t('restaurant.users.dialog.email')}
              </Label>
              <Input
                id="email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="col-span-3"
                placeholder={t('restaurant.users.dialog.email_placeholder')}
                required
                disabled={!!user} // Disable email editing for existing users
              />
            </div>
            
            {!user && ( // Only show password fields for new users
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    {t('restaurant.users.dialog.password')}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="col-span-3"
                    placeholder={t('restaurant.users.dialog.password_placeholder')}
                    minLength={6}
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="confirmPassword" className="text-right">
                    {t('restaurant.users.dialog.confirm_password')}
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formConfirmPassword}
                    onChange={(e) => setFormConfirmPassword(e.target.value)}
                    className="col-span-3"
                    placeholder={t('restaurant.users.dialog.confirm_password_placeholder')}
                  />
                </div>
              </>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                {t('restaurant.users.dialog.role')}
              </Label>
              <Select 
                value={formRole} 
                onValueChange={(value) => setFormRole(value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={t('restaurant.users.dialog.role_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                {t('restaurant.users.dialog.status')}
              </Label>
              <Select 
                value={formStatus} 
                onValueChange={(value) => setFormStatus(value as 'On Shift' | 'Off Shift' | 'On Break')}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="On Shift">{t('restaurant.users.status.on_shift')}</SelectItem>
                  <SelectItem value="Off Shift">{t('restaurant.users.status.off_shift')}</SelectItem>
                  <SelectItem value="On Break">{t('restaurant.users.status.on_break')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            

          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              {t('restaurant.users.dialog.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading 
                ? t('restaurant.users.dialog.saving') 
                : (user ? t('restaurant.users.dialog.update_user') : t('restaurant.users.dialog.create_user'))
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}