
"use client"
import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger
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
import { type PaymentMethod } from "@/lib/types"
import { useI18n } from '@/context/i18n-context'
import { PlusCircle, Trash2 } from 'lucide-react'

export function PaymentMethodDialog({ 
  children, 
  method,
  onSave,
}: { 
  children: React.ReactNode, 
  method?: PaymentMethod,
  onSave: (method: PaymentMethod | Omit<PaymentMethod, 'id'>) => void,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isEditMode = !!method;
  const { t } = useI18n();

  const [name, setName] = useState('');
  const [type, setType] = useState<'cash' | 'card' | 'bank_transfer'>('card');
  const [banks, setBanks] = useState<string[]>([]);
  const [newBank, setNewBank] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(method?.name || '');
      setType(method?.type || 'card');
      setBanks(method?.banks || []);
      setNewBank('');
    }
  }, [isOpen, method]);


  const handleSubmit = () => {
    const methodData = {
      name,
      type,
      enabled: method?.enabled ?? true,
      banks: type === 'bank_transfer' ? banks : undefined
    };
    if (isEditMode) {
      onSave({ id: method.id, ...methodData });
    } else {
      onSave(methodData);
    }
    setIsOpen(false);
  };
  
  const handleAddBank = () => {
    if (newBank.trim()) {
        setBanks(prev => [...prev, newBank.trim()]);
        setNewBank('');
    }
  }

  const handleDeleteBank = (bankToDelete: string) => {
    setBanks(prev => prev.filter(b => b !== bankToDelete));
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{isEditMode ? t('restaurant.payment_method_dialog.edit_title') : t('restaurant.payment_method_dialog.add_title')}</DialogTitle>
          <DialogDescription>
            {isEditMode ? t('restaurant.payment_method_dialog.edit_desc') : t('restaurant.payment_method_dialog.add_desc')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">{t('restaurant.payment_method_dialog.name')}</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">{t('restaurant.payment_method_dialog.type')}</Label>
            <Select value={type} onValueChange={(value) => setType(value as any)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={t('restaurant.payment_method_dialog.select_type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='card'>{t('restaurant.payment_methods.types.card')}</SelectItem>
                <SelectItem value='cash'>{t('restaurant.payment_methods.types.cash')}</SelectItem>
                <SelectItem value='bank_transfer'>{t('restaurant.payment_methods.types.bank_transfer')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === 'bank_transfer' && (
            <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">{t('restaurant.payment_method_dialog.banks')}</Label>
                <div className="col-span-3 space-y-2">
                    {banks.map(bank => (
                        <div key={bank} className="flex items-center gap-2">
                            <Input value={bank} readOnly className="flex-1"/>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/80 hover:text-destructive" onClick={() => handleDeleteBank(bank)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <div className="flex items-center gap-2">
                        <Input 
                            placeholder={t('restaurant.payment_method_dialog.add_bank')}
                            value={newBank}
                            onChange={(e) => setNewBank(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddBank()}
                        />
                         <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleAddBank}>
                            <PlusCircle className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
          )}

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>{t('dialog.cancel')}</Button>
          <Button type="submit" onClick={handleSubmit}>{isEditMode ? t('dialog.save') : t('dialog.create')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
