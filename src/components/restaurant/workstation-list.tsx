"use client"

import React, { useState, useEffect } from 'react'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  MoreHorizontal, 
  PlusCircle, 
  Pencil, 
  Trash2,
  GripVertical,
  Lock,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useI18nStore } from '@/lib/stores/i18n-store'
import { type IWorkstation } from '@/models/Workstation'
import { WorkstationDialog } from './workstation-dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/helpers'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface WorkstationListProps {
  workstations: IWorkstation[]
  loading: boolean
  error: string | null
  onAdd: (workstation: Partial<IWorkstation> & { name: string }) => Promise<void>
  onUpdate: (id: string, workstation: Partial<IWorkstation> & { name: string }) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onReorder?: (workstations: IWorkstation[]) => void
}

export function WorkstationList({ workstations, loading, error, onAdd, onUpdate, onDelete, onReorder }: WorkstationListProps) {
  const { t } = useI18nStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingWorkstation, setEditingWorkstation] = useState<IWorkstation | undefined>(undefined)
  const [draggedWorkstationId, setDraggedWorkstationId] = useState<string | null>(null)
  const [dragOverWorkstationId, setDragOverWorkstationId] = useState<string | null>(null)

  const handleOpenDialog = (workstation?: IWorkstation) => {
    setEditingWorkstation(workstation)
    setIsDialogOpen(true)
  }

  const handleSave = async (workstationData: Partial<IWorkstation> & { name: string }) => {
    try {
      if (editingWorkstation) {
        await onUpdate(editingWorkstation.id, workstationData)
        toast.success(t('restaurant.workstations.updated_success'))
      } else {
        await onAdd(workstationData)
        toast.success(t('restaurant.workstations.created_success'))
      }
    } catch (error: any) {
      toast.error(error.message || t('restaurant.workstations.error'))
    }
  }

  const handleDelete = async (id: string, name: string) => {
    try {
      await onDelete(id)
      toast.success(t('restaurant.workstations.deleted_success', { name }))
    } catch (error: any) {
      toast.error(error.message || t('restaurant.workstations.error'))
    }
  }

  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, id: string, workstationName: string) => {
    // Prevent dragging of default workstations (Kitchen and Ready)
    if (['Kitchen', 'Ready'].includes(workstationName)) {
      e.preventDefault();
      return;
    }
    
    setDraggedWorkstationId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedWorkstationId(null)
    setDragOverWorkstationId(null)
  }

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault()
  }

  const handleDragEnter = (e: React.DragEvent<HTMLTableRowElement>, id: string) => {
    e.preventDefault()
    if (draggedWorkstationId !== id) {
      setDragOverWorkstationId(id)
    }
  }

  const handleDrop = async (e: React.DragEvent<HTMLTableRowElement>, dropWorkstationId: string, dropWorkstationName: string) => {
    e.preventDefault()
    
    // Prevent dropping onto default workstations (Kitchen and Ready)
    if (['Kitchen', 'Ready'].includes(dropWorkstationName)) {
      handleDragEnd()
      return
    }
    
    if (draggedWorkstationId === null || draggedWorkstationId === dropWorkstationId) {
      handleDragEnd()
      return
    }

    const safeWorkstations = Array.isArray(workstations) ? workstations : [];
    const fromIndex = safeWorkstations.findIndex(w => w.id === draggedWorkstationId)
    const toIndex = safeWorkstations.findIndex(w => w.id === dropWorkstationId)

    if (fromIndex === -1 || toIndex === -1) {
      handleDragEnd()
      return
    }

    // Create new positions array
    const newWorkstations = [...safeWorkstations]
    const [removed] = newWorkstations.splice(fromIndex, 1)
    newWorkstations.splice(toIndex, 0, removed)

    // Create positions update array
    const positions = newWorkstations.map((workstation, index) => ({
      id: workstation.id,
      position: index
    }))

    try {
      // Send the position updates to the API using the dedicated PATCH endpoint
      const response = await fetch('/api/workstations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ positions }),
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update workstation positions')
      }

      // Call the onReorder callback with the updated workstations
      if (onReorder) {
        onReorder(Array.isArray(result.data) ? result.data : [])
      }

      toast.success(t('restaurant.workstations.positions_updated'))
    } catch (error: any) {
      toast.error(error.message || t('restaurant.workstations.error'))
      console.error('Error updating workstation positions:', error)
      
      // In case of error, refresh workstations from API to ensure consistency
      try {
        const refreshResponse = await fetch('/api/workstations')
        const refreshResult = await refreshResponse.json()
        if (refreshResult.success && onReorder) {
          onReorder(Array.isArray(refreshResult.data) ? refreshResult.data : [])
        }
      } catch (refreshError) {
        console.error('Error refreshing workstations:', refreshError)
      }
    }

    handleDragEnd()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <p>{t('restaurant.loading')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-32">
        <p className="text-red-500">{t('restaurant.workstations.fetch_error')}: {error}</p>
      </div>
    )
  }

  return (
    <TooltipProvider>
    <>
      <WorkstationDialog
        workstation={editingWorkstation}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
      />
      
      <div className="p-6">
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>{t('restaurant.workstations.name')}</TableHead>
                <TableHead>
                  <span className="sr-only">{t('restaurant.workstations.actions')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(workstations) ? workstations : []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    <p>{t('restaurant.workstations.no_workstations')}</p>
                  </TableCell>
                </TableRow>
              ) : (
                (Array.isArray(workstations) ? workstations : []).map((workstation) => (
                  <TableRow 
                    key={workstation.id || `workstation-${workstation.name}-${workstation.position}`}
                    draggable={!['Kitchen', 'Ready'].includes(workstation.name)}
                    onDragStart={(e) => handleDragStart(e, workstation.id, workstation.name)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, workstation.id)}
                    onDrop={(e) => handleDrop(e, workstation.id, workstation.name)}
                    className={cn(
                      ['Kitchen', 'Ready'].includes(workstation.name) ? "cursor-default" : "cursor-grab",
                      draggedWorkstationId === workstation.id && "opacity-50",
                      dragOverWorkstationId === workstation.id && "bg-primary/10"
                    )}
                  >
                    <TableCell className="w-8">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            {['Kitchen', 'Ready'].includes(workstation.name) ? (
                              <Lock className="h-5 w-5 text-muted-foreground/50" />
                            ) : (
                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {['Kitchen', 'Ready'].includes(workstation.name) 
                            ? t('restaurant.workstations.default_locked')
                            : t('restaurant.workstations.drag_to_reorder')}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {workstation.name}
                        {['Kitchen', 'Ready'].includes(workstation.name) && (
                          <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                            {t('restaurant.workstations.default')}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">{t('restaurant.workstations.toggle_menu')}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t('restaurant.workstations.actions')}</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => handleOpenDialog(workstation)}>
                              {t('restaurant.workstations.edit')}
                            </DropdownMenuItem>
                            {/* Prevent deletion of default workstations */}
                            {!['Kitchen', 'Ready'].includes(workstation.name) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive" 
                                  onSelect={() => handleDelete(workstation.id, workstation.name)}
                                >
                                  {t('restaurant.workstations.delete')}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
    </TooltipProvider>
  )
}
