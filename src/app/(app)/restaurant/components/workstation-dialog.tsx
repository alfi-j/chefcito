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
  onSave: (workstation: Partial<IWorkstation> & { name: string }) => void
}

export function WorkstationDialog({ workstation, isOpen, onOpenChange, onSave }: WorkstationDialogProps) {
  const { t } = useI18nStore()
  const [name, setName] = useState(workstation?.name || '')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate inputs
    if (!name.trim()) {
      setError(t('restaurant.workstations.errors.name_required'))
      return
    }
    
    setError('')
    onSave({
      name: name.trim()
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