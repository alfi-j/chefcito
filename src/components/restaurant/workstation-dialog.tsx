"use client"

import React, { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from 'react-i18next'
import { useWorkstationsStore } from '@/lib/stores/workstations-store'
import { type IWorkstation } from '@/models/Workstation'

interface WorkstationDialogProps {
  workstation?: IWorkstation
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSave: (workstation: Partial<IWorkstation> & { name: string }) => void
}

export function WorkstationDialog({ workstation, isOpen, onOpenChange, onSave }: WorkstationDialogProps) {
  const { t } = useTranslation()
  
  const formName = useWorkstationsStore((state) => state.form.name)
  const formError = useWorkstationsStore((state) => state.form.error)
  const resetForm = useWorkstationsStore((state) => state.resetForm)
  const clearForm = useWorkstationsStore((state) => state.clearForm)
  const setFormName = useWorkstationsStore((state) => state.setFormName)
  const setFormError = useWorkstationsStore((state) => state.setFormError)
  const getIsFormValid = useWorkstationsStore((state) => state.getIsFormValid)
  
  // Reset form when dialog opens/closes or workstation changes
  useEffect(() => {
    if (isOpen) {
      resetForm(workstation)
    } else {
      clearForm()
    }
  }, [isOpen, workstation, resetForm, clearForm])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate inputs
    if (!getIsFormValid()) {
      setFormError(t('restaurant.workstations.errors.name_required'))
      return
    }
    
    onSave({
      name: formName.trim()
    })
    clearForm()
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
          <DialogDescription>
            {t('restaurant.workstations.dialog_description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {formError && (
              <div className="text-sm text-destructive">{formError}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">{t('restaurant.workstations.name')}</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
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