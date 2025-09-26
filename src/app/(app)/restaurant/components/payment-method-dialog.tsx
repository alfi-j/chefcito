
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
<<<<<<< HEAD
  onOpenChange,
=======
>>>>>>> d3399ff (Chefcito Beta!)
  onSave,
}: { 
  children: React.ReactNode, 
  method?: PaymentMethod,
<<<<<<< HEAD
  onOpenChange?: (open: boolean) => void,
=======
>>>>>>> d3399ff (Chefcito Beta!)
  onSave: (method: PaymentMethod | Omit<PaymentMethod, 'id'>) => void,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isEditMode = !!method;
  const { t } = useI18n();

<<<<<<< HEAD
  const [name, setName] = useState(method?.name || '');
  const [type, setType] = useState<"cash" | "card" | "online">(method?.type || 'card');
  const [enabled, setEnabled] = useState(method?.enabled ?? true);
  const [banks, setBanks] = useState<string[]>(method?.banks || []);
=======
  const [name, setName] = useState('');
  const [type, setType] = useState<'cash' | 'card' | 'bank_transfer'>('card');
  const [banks, setBanks] = useState<string[]>([]);
>>>>>>> d3399ff (Chefcito Beta!)
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
<<<<<<< HEAD
      banks: type === 'card' ? banks : undefined
=======
      banks: type === 'bank_transfer' ? banks : undefined
>>>>>>> d3399ff (Chefcito Beta!)
    };
    if (isEditMode) {
      onSave({ id: method.id, ...methodData });
    } else {
      onSave(methodData);
    }
<<<<<<< HEAD
    
    if (onOpenChange) {
      onOpenChange(false);
    } else {
      setIsOpen(false);
    }
=======
    setIsOpen(false);
>>>>>>> d3399ff (Chefcito Beta!)
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

<<<<<<< HEAD
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const methodData = {
      name,
      type: type as "cash" | "card" | "online",
      enabled,
      banks: type === 'card' ? banks : undefined,
    };

    try {
      if (method) {
        await onSave({ 
          id: method.id, 
          name: methodData.name,
          type: methodData.type,
          enabled: methodData.enabled,
          banks: methodData.banks
        });
      } else {
        await onSave({
          name: methodData.name,
          type: methodData.type,
          enabled: methodData.enabled,
          banks: methodData.banks
        });
      }
      if (onOpenChange) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to save payment method:", error);
    }
  };

=======
>>>>>>> d3399ff (Chefcito Beta!)
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
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('restaurant.payment_method_dialog.name')}</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">{t('restaurant.payment_method_dialog.type')}</Label>
            <Select value={type} onValueChange={(value) => setType(value as any)}>
              <SelectTrigger id="type">
                <SelectValue placeholder={t('restaurant.payment_method_dialog.select_type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='card'>{t('restaurant.payment_methods.types.card')}</SelectItem>
                <SelectItem value='cash'>{t('restaurant.payment_methods.types.cash')}</SelectItem>
<<<<<<< HEAD
=======
                <SelectItem value='bank_transfer'>{t('restaurant.payment_methods.types.bank_transfer')}</SelectItem>
>>>>>>> d3399ff (Chefcito Beta!)
              </SelectContent>
            </Select>
          </div>

<<<<<<< HEAD

          {type === 'card' && (
            <div className="space-y-2">
              <Label>{t('restaurant.payment_methods.dialog.banks')}</Label>
              <div className="flex gap-2">
                <Input
                  value={newBank}
                  onChange={(e) => setNewBank(e.target.value)}
                  placeholder={t('restaurant.payment_methods.dialog.bank_name')}
                />
                <Button 
                  type="button"
                  onClick={() => {
                    if (newBank.trim()) {
                      setBanks(prev => [...prev, newBank.trim()]);
                      setNewBank('');
                    }
                  }}
                >
                  {t('restaurant.payment_methods.dialog.add_bank')}
                </Button>
              </div>
              {banks.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {banks.map((bank, index) => (
                    <div key={index} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-secondary text-secondary-foreground">
                      {bank}
                      <button 
                        type="button"
                        onClick={() => setBanks(banks.filter((_, i) => i !== index))}
                        className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                      >
                        <span className="text-xs">✕</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
=======
          {type === 'bank_transfer' && (
            <div className="space-y-2">
                <Label>{t('restaurant.payment_method_dialog.banks')}</Label>
                <div className="space-y-2">
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
>>>>>>> d3399ff (Chefcito Beta!)
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
