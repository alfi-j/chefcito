import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Role {
  id: string;
  name: string;
}

export function RoleAssignment() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  // Fetch users and roles
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch users
        const usersResponse = await fetch('/api/users')
        const usersResult = await usersResponse.json()
        
        // Fetch roles
        const rolesResponse = await fetch('/api/roles')
        const rolesResult = await rolesResponse.json()
        
        if (Array.isArray(usersResult) && rolesResult.success) {
          setUsers(usersResult)
          setRoles(rolesResult.data)
        } else {
          toast.error('Failed to fetch data')
          console.error('Users result:', usersResult, 'Roles result:', rolesResult)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Error fetching data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleRoleChange = async (userId: string, newRole: string) => {
    // Prevent changing role to the same role
    const user = users.find(u => u.id === userId);
    if (user?.role === newRole) {
      toast.info('User already has this role');
      return;
    }
    
    try {
      setUpdatingUserId(userId);
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'updateRole',
          role: newRole 
        }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ))
        toast.success(`User role updated to ${newRole}`)
      } else {
        toast.error(result.error || 'Failed to update user role')
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      toast.error('Error updating user role')
    } finally {
      setUpdatingUserId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <p>Loading users and roles...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Role Assignment</h3>
        <p className="text-sm text-muted-foreground">
          Assign roles to users
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {/* Mobile view */}
          <div className="md:hidden">
            {users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found.
              </div>
            ) : roles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No roles found. Please create roles first.
              </div>
            ) : (
              <div className="space-y-4 p-4">
                {users.map((user) => (
                  <div key={user.id} className="border rounded-lg p-4 space-y-3">
                    <div>
                      <h4 className="font-medium">{user.name}</h4>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Current Role</span>
                      <Badge variant="secondary">{user.role}</Badge>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Assign Role</span>
                      <Select 
                        value={user.role} 
                        onValueChange={(value) => handleRoleChange(user.id, value)}
                        disabled={updatingUserId === user.id}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.name}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {updatingUserId === user.id && (
                        <p className="text-xs text-muted-foreground">Updating...</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Desktop view */}
          <div className="hidden md:block">
            {roles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No roles found. Please create roles first in the Roles tab.
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Current Role</TableHead>
                      <TableHead>Assign Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>
                          <Select 
                            value={user.role} 
                            onValueChange={(value) => handleRoleChange(user.id, value)}
                            disabled={updatingUserId === user.id}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map((role) => (
                                <SelectItem key={role.id} value={role.name}>
                                  {role.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {updatingUserId === user.id && (
                            <p className="text-xs text-muted-foreground mt-1">Updating...</p>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {users.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found.
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
