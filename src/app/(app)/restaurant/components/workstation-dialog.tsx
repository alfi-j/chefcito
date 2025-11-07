"use client"

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useI18nStore } from '@/lib/stores/i18n-store'
import { type IWorkstation } from '@/models/Workstation'

interface WorkstationDialogProps {
  workstation?: IWorkstation
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSave: (workstation: Partial<IWorkstation> & { name: string; states: { new: string; inProgress: string; ready: string } }) => void
}

export function WorkstationDialog({ workstation, isOpen, onOpenChange, onSave }: WorkstationDialogProps) {
  const { t } = useI18nStore()
  const [name, setName] = useState(workstation?.name || '')
  const [newState, setNewState] = useState(workstation?.states.new || 'new')
  const [inProgressState, setInProgressState] = useState(workstation?.states.inProgress || 'in progress')
  const [readyState, setReadyState] = useState(workstation?.states.ready || 'ready')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate inputs
    if (!name.trim()) {
      setError(t('restaurant.workstations.errors.name_required'))
      return
    }
    
    if (!newState.trim() || !inProgressState.trim() || !readyState.trim()) {
      setError(t('restaurant.workstations.errors.states_required'))
      return
    }
    
    // Check for duplicate state names
    const stateNames = [newState, inProgressState, readyState]
    if (new Set(stateNames).size !== stateNames.length) {
      setError(t('restaurant.workstations.errors.states_unique'))
      return
    }
    
    setError('')
    onSave({
      name: name.trim(),
      states: {
        new: newState.trim(),
        inProgress: inProgressState.trim(),
        ready: readyState.trim()
      }
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {workstation 
              ? t('restaurant.workstations.edit_workstation') 
              : t('restaurant.workstations.add_workstation')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">{t('restaurant.workstations.name')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newState">{t('restaurant.workstations.states.new')}</Label>
              <Input
                id="newState"
                value={newState}
                onChange={(e) => setNewState(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="inProgressState">{t('restaurant.workstations.states.in_progress')}</Label>
              <Input
                id="inProgressState"
                value={inProgressState}
                onChange={(e) => setInProgressState(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="readyState">{t('restaurant.workstations.states.ready')}</Label>
              <Input
                id="readyState"
                value={readyState}
                onChange={(e) => setReadyState(e.target.value)}
                required
              />
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('dialog.cancel')}
            </Button>
            <Button type="submit">
              {workstation ? t('dialog.save') : t('dialog.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}