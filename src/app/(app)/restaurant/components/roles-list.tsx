"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Plus } from "lucide-react"
import { useI18nStore } from '@/lib/stores/i18n-store'
import { toast } from "sonner"
import { useNormalizedUserStore } from "@/lib/stores/user-store-normalized"
import { RoleBasedContent } from "@/components/role-based-content"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RoleAssignment } from './role-assignment'

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
}

const PERMISSION_OPTIONS = [
  { id: 'menu_access', labelKey: 'restaurant.roles.permissions.manage_menu' },
  { id: 'order_management', labelKey: 'restaurant.roles.permissions.manage_orders' },
  { id: 'kds_access', labelKey: 'restaurant.roles.permissions.kds_access' },
  { id: 'reports_access', labelKey: 'restaurant.roles.permissions.view_reports' },
  { id: 'restaurant_settings', labelKey: 'restaurant.roles.permissions.manage_restaurant_settings' },
  { id: 'user_management', labelKey: 'restaurant.roles.permissions.manage_staff' },
  { id: 'payment_processing', labelKey: 'restaurant.roles.permissions.manage_payments' },
  { id: 'inventory_management', labelKey: 'restaurant.roles.permissions.manage_inventory' },
  { id: 'role_management', labelKey: 'restaurant.roles.permissions.manage_roles' },
];

export function RolesList() {
  const { t } = useI18nStore()
  const currentUser = useNormalizedUserStore().getCurrentUser()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  })
  const [activeTab, setActiveTab] = useState<'roles' | 'assignment'>('roles')

  // Check if current user is an Owner
  const isOwner = currentUser?.role === 'Owner';

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch('/api/roles')
        const result = await response.json()
        
        if (result.success) {
          setRoles(result.data)
          
          // If there are no roles, create predefined roles
          if (result.data.length === 0) {
            createPredefinedRoles();
          }
        } else {
          toast.error(t('restaurant.toast.fetch_roles_failed'))
        }
      } catch (error) {
        console.error('Error fetching roles:', error)
        toast.error(t('restaurant.toast.fetch_roles_error'))
      } finally {
        setLoading(false)
      }
    }

    fetchRoles()
  }, [])

  const createPredefinedRoles = async () => {
    const predefinedRoles = [
      {
        name: t('profile.roles.roles.waiter'),
        description: t('restaurant.roles.predefined_roles.waiter_desc'),
        permissions: ['menu_access', 'order_management']
      },
      {
        name: t('profile.roles.roles.cashier'),
        description: t('restaurant.roles.predefined_roles.cashier_desc'),
        permissions: ['menu_access', 'order_management', 'payment_processing']
      },
      {
        name: t('profile.roles.roles.kitchen_staff'),
        description: t('restaurant.roles.predefined_roles.kitchen_staff_desc'),
        permissions: ['kds_access', 'inventory_management']
      }
    ];

    try {
      const createdRoles = [];
      for (const roleData of predefinedRoles) {
        const response = await fetch('/api/roles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(roleData),
        });

        const result = await response.json();
        if (result.success) {
          createdRoles.push(result.data);
        }
      }
      
      if (createdRoles.length > 0) {
        setRoles(createdRoles);
        toast.success(t('restaurant.toast.predefined_roles_created'));
      }
    } catch (error) {
      console.error('Error creating predefined roles:', error);
      toast.error(t('restaurant.toast.create_predefined_roles_error'));
    }
  }

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role)
      setFormData({
        name: role.name,
        description: role.description || '',
        permissions: [...role.permissions]
      })
    } else {
      setEditingRole(null)
      setFormData({
        name: '',
        description: '',
        permissions: []
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingRole(null)
  }

  const handlePermissionToggle = (permissionId: string) => {
    setFormData(prev => {
      const permissions = prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
      
      return { ...prev, permissions }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingRole ? `/api/roles?id=${editingRole.id}` : '/api/roles'
      const method = editingRole ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const result = await response.json()
      
      if (result.success) {
        if (editingRole) {
          setRoles(roles.map(role => role.id === editingRole.id ? result.data : role))
          toast.success(t('restaurant.toast.role_updated'))
        } else {
          setRoles([...roles, result.data])
          toast.success(t('restaurant.toast.role_created'))
        }
        handleCloseDialog()
      } else {
        toast.error(result.error || t('restaurant.toast.operation_failed'))
      }
    } catch (error) {
      console.error('Error saving role:', error)
      toast.error(t('restaurant.toast.save_role_error'))
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    try {
      const response = await fetch(`/api/roles?id=${roleId}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (result.success) {
        setRoles(roles.filter(role => role.id !== roleId))
        toast.success(t('restaurant.toast.role_deleted'))
      } else {
        toast.error(result.error || t('restaurant.toast.delete_role_failed'))
      }
    } catch (error) {
      console.error('Error deleting role:', error)
      toast.error(t('restaurant.toast.delete_role_error'))
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <p>{t('restaurant.roles.loading')}</p>
      </div>
    )
  }

  // Only owners can access roles management
  if (!isOwner) {
    return (
      <div className="flex justify-center items-center h-32">
        <p>{t('restaurant.roles.access_denied')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium">{t('restaurant.roles.title')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('restaurant.roles.description')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={activeTab === 'roles' ? 'default' : 'outline'}
            onClick={() => setActiveTab('roles')}
          >
            {t('restaurant.roles.tabs.roles')}
          </Button>
          <Button 
            variant={activeTab === 'assignment' ? 'default' : 'outline'}
            onClick={() => setActiveTab('assignment')}
          >
            {t('restaurant.roles.tabs.assignment')}
          </Button>
          {activeTab === 'roles' && (
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              {t('restaurant.roles.add_role')}
            </Button>
          )}
        </div>
      </div>

      {activeTab === 'roles' ? (
        <Card>
          <CardContent className="p-0">
            {/* Mobile view */}
            <div className="md:hidden">
              {roles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('restaurant.roles.no_roles')}
                </div>
              ) : (
                <div className="space-y-4 p-4">
                  {roles.map((role) => (
                    <div key={role.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{role.name}</h4>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(role)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRole(role.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {role.description || '-'}
                        </p>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium mb-2">{t('restaurant.roles.table.permissions')}</h5>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.map((permission) => (
                            <Badge key={permission} variant="secondary" className="text-xs">
                              {t(`restaurant.roles.permissions.${permission}`)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Desktop view */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('restaurant.roles.table.name')}</TableHead>
                    <TableHead>{t('restaurant.roles.table.description')}</TableHead>
                    <TableHead>{t('restaurant.roles.table.permissions')}</TableHead>
                    <TableHead className="text-right">{t('restaurant.roles.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>{role.description || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.map((permission) => (
                            <Badge key={permission} variant="secondary">
                              {t(`restaurant.roles.permissions.${permission}`)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(role)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRole(role.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {roles.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {t('restaurant.roles.no_roles')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <RoleAssignment />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? t('restaurant.roles.dialog.edit_title') : t('restaurant.roles.dialog.add_title')}
            </DialogTitle>
            <DialogDescription>
              {editingRole 
                ? t('restaurant.roles.dialog.edit_description') 
                : t('restaurant.roles.dialog.add_description')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  {t('restaurant.roles.dialog.name')}
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  {t('restaurant.roles.dialog.description')}
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">
                  {t('restaurant.roles.dialog.permissions')}
                </Label>
                <div className="col-span-3 space-y-2">
                  {PERMISSION_OPTIONS.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.id}
                        checked={formData.permissions.includes(option.id)}
                        onCheckedChange={() => handlePermissionToggle(option.id)}
                      />
                      <label
                        htmlFor={option.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {t(option.labelKey)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">
                {editingRole ? t('restaurant.roles.dialog.update_role') : t('restaurant.roles.dialog.create_role')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}