
"use client"
import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useI18n } from '@/context/i18n-context'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DeleteConfirmationDialogProps {
  children: React.ReactNode;
  count: number;
  onConfirm: () => void;
}

export function DeleteConfirmationDialog({ children, count, onConfirm }: DeleteConfirmationDialogProps) {
    const { t } = useI18n();
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {children}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('restaurant.delete_dialog.title', { count })}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('restaurant.delete_dialog.desc')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t('dialog.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                        className={cn(buttonVariants({ variant: "destructive" }))}
                        onClick={onConfirm}
                    >
                        {t('restaurant.delete_dialog.confirm')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
