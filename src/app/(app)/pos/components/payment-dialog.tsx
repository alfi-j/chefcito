"use client"

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  CreditCard, 
  Wallet, 
  Building, 
  Plus, 
  Minus, 
  Users,
  Check
} from "lucide-react"
import { useI18n } from '@/context/i18n-context';
import { type MenuItem, type OrderItem } from '@/lib/types';
import { useMenu } from '@/hooks/use-menu';

interface PaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orderItems: OrderItem[];
  totalAmount: number;
  onConfirmPayment: (paymentData: any) => void;
}

export function PaymentDialog({ 
  isOpen, 
  onOpenChange, 
  orderItems, 
  totalAmount,
  onConfirmPayment
}: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [splitMode, setSplitMode] = useState(false);
  const [numberOfPeople, setNumberOfPeople] = useState(2);
  const [bills, setBills] = useState<any[]>([]);
  const [unassignedItems, setUnassignedItems] = useState<OrderItem[]>(orderItems);
  const { t } = useI18n();
  const { paymentMethods } = useMenu();

  // Reset state when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setPaymentMethod('');
      setSelectedBank('');
      setSplitMode(false);
      setNumberOfPeople(2);
      setBills([]);
      setUnassignedItems(orderItems);
    }
  }, [isOpen, orderItems]);

  const getIconForMethod = (type: string) => {
    switch (type) {
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'cash': return <Wallet className="h-4 w-4" />;
      case 'bank_transfer': return <Building className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  const calculateItemTotal = (item: OrderItem): number => {
    const basePrice = typeof item.menuItem.price === 'string' 
      ? parseFloat(item.menuItem.price) 
      : item.menuItem.price;
      
    const extrasPrice = item.selectedExtras?.reduce((acc, extra) => {
      const extraPrice = typeof extra.price === 'string' 
        ? parseFloat(extra.price) 
        : extra.price;
      return acc + extraPrice;
    }, 0) || 0;
    
    return (basePrice + extrasPrice) * item.quantity;
  };

  const handleConfirm = () => {
    if (!paymentMethod) return;
    
    const selectedMethod = paymentMethods.find(m => m.id === paymentMethod);
    
    onConfirmPayment({
      method: selectedMethod,
      bank: selectedBank,
      amount: totalAmount,
      splitMode,
      bills: splitMode ? bills : undefined
    });
    
    onOpenChange(false);
  };

  const handleAddBill = () => {
    setBills([...bills, { 
      id: Date.now(), 
      items: [], 
      amount: 0,
      paymentMethod: '',
      bank: ''
    }]);
  };

  const handleRemoveBill = (billId: number) => {
    const billToRemove = bills.find(bill => bill.id === billId);
    if (billToRemove) {
      setUnassignedItems([...unassignedItems, ...billToRemove.items]);
      setBills(bills.filter(bill => bill.id !== billId));
    }
  };

  const handleAssignItemToBill = (billId: number, item: OrderItem) => {
    const updatedBills = bills.map(bill => {
      if (bill.id === billId) {
        const itemTotal = calculateItemTotal(item);
        const updatedItems = [...bill.items, item];
        const updatedAmount = updatedItems.reduce((acc, currentItem) => 
          acc + calculateItemTotal(currentItem), 0
        );
        
        return {
          ...bill,
          items: updatedItems,
          amount: updatedAmount
        };
      }
      return bill;
    });
    
    setBills(updatedBills);
    setUnassignedItems(unassignedItems.filter(i => i.id !== item.id));
  };

  const handleRemoveItemFromBill = (billId: number, itemId: string) => {
    const updatedBills = bills.map(bill => {
      if (bill.id === billId) {
        const updatedItems = bill.items.filter(item => item.id !== itemId);
        const updatedAmount = updatedItems.reduce((acc, item) => 
          acc + calculateItemTotal(item), 0
        );
        
        return {
          ...bill,
          items: updatedItems,
          amount: updatedAmount
        };
      }
      return bill;
    });
    
    const itemToRestore = bills
      .find(bill => bill.id === billId)
      ?.items.find(item => item.id === itemId);
      
    if (itemToRestore) {
      setUnassignedItems([...unassignedItems, itemToRestore]);
    }
    
    setBills(updatedBills);
  };

  const perPersonAmount = totalAmount / numberOfPeople;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{t('pos.payment_dialog.title')}</DialogTitle>
          <DialogDescription>
            {t('pos.payment_dialog.total_due')}: <span className="font-bold text-lg text-primary">${totalAmount.toFixed(2)}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4 min-h-0">
          <ScrollArea className="h-full -mx-6">
            <div className="space-y-3 px-4">
              <div>
                <Label className="font-semibold text-base">{t('pos.payment_dialog.method')}</Label>
                <RadioGroup 
                  className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2"
                  onValueChange={setPaymentMethod}
                  value={paymentMethod}
                >
                  {paymentMethods.filter(m => m.enabled).map(method => (
                    <div key={method.id}>
                      <RadioGroupItem value={method.id} id={method.id} className="peer sr-only" />
                      <Label
                        htmlFor={method.id}
                        className="flex items-center gap-3 rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        {getIconForMethod(method.type)}
                        <span className="font-semibold">{method.name}</span>
                        <Check className="h-4 w-4 ml-auto text-primary opacity-0 peer-data-[state=checked]:opacity-100" />
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              {paymentMethod && paymentMethods.find(m => m.id === paymentMethod)?.banks && paymentMethods.find(m => m.id === paymentMethod)?.banks!.length > 0 && (
                <div>
                  <Label className="font-semibold text-base" htmlFor="bank-select">
                    {t('pos.payment_dialog.select_bank')}
                  </Label>
                  <Select onValueChange={setSelectedBank} value={selectedBank}>
                    <SelectTrigger className="mt-2" id="bank-select">
                      <SelectValue placeholder={t('pos.payment_dialog.select_bank')} />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.find(m => m.id === paymentMethod)?.banks?.map(bank => (
                        <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <Separator />
              
              <div>
                <div className="flex items-center justify-between">
                  <Label className="font-semibold text-base">{t('pos.payment_dialog.split_bill')}</Label>
                  <Button 
                    variant={splitMode ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setSplitMode(!splitMode)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {splitMode ? t('pos.payment_dialog.split_bill') : t('pos.payment_dialog.split_bill')}
                  </Button>
                </div>
                
                {splitMode && (
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span>{t('pos.payment_dialog.per_person')}</span>
                      <span className="font-bold">${perPersonAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => setNumberOfPeople(Math.max(2, numberOfPeople - 1))}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-semibold">{numberOfPeople} {t('pos.payment_dialog.people')}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => setNumberOfPeople(numberOfPeople + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          {/* Right Side: Order Summary / Item Assignment */}
          <ScrollArea className="h-full -mx-6">
            <div className="space-y-3 px-4">
              {/* Order Summary */}
              <div className="border rounded-lg">
                <div className="p-4 border-b">
                  <h4 className="font-medium">{t('pos.payment_dialog.order_summary')}</h4>
                </div>
                
                <div className="space-y-3 px-4 py-4">
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-3">
                      {orderItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{item.quantity}x {item.menuItem.name}</div>
                            {item.selectedExtras && item.selectedExtras.length > 0 && (
                              <div className="text-sm text-muted-foreground">
                                {item.selectedExtras.map(extra => extra.name).join(', ')}
                              </div>
                            )}
                          </div>
                          <div className="font-medium">
                            ${calculateItemTotal(item).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center pt-2">
                    <div className="text-lg font-bold">{t('pos.payment_dialog.total')}</div>
                    <div className="text-lg font-bold text-primary">
                      ${totalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Split Bill Section */}
              {splitMode && (
                <div className="border rounded-lg">
                  <div className="p-4 border-b flex justify-between items-center">
                    <h4 className="font-medium">{t('pos.payment_dialog.bill')}</h4>
                    <Button onClick={handleAddBill} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      {t('pos.payment_dialog.add_bill')}
                    </Button>
                  </div>
                  
                  <div className="space-y-4 p-4">
                    {unassignedItems.length > 0 && (
                      <div className="border rounded-md p-3">
                        <h5 className="font-medium mb-2">{t('pos.payment_dialog.unassigned_items')}</h5>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {unassignedItems.map(item => (
                            <div key={item.id} className="flex justify-between items-center text-sm">
                              <span>{item.quantity}x {item.menuItem.name}</span>
                              <div className="flex items-center space-x-2">
                                <span>${calculateItemTotal(item).toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        {unassignedItems.length === 0 && (
                          <p className="text-sm text-muted-foreground">{t('pos.payment_dialog.all_items_assigned')}</p>
                        )}
                      </div>
                    )}
                    
                    {bills.map(bill => (
                      <div key={bill.id} className="border rounded-md p-3">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-medium">{t('pos.payment_dialog.bill')} #{bills.findIndex(b => b.id === bill.id) + 1}</h5>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRemoveBill(bill.id)}
                          >
                            Remove
                          </Button>
                        </div>
                        
                        <div className="mb-3">
                          <Label className="text-sm">{t('pos.payment_dialog.items_in_bill')}</Label>
                          {bill.items.length > 0 ? (
                            <div className="space-y-2 mt-1 max-h-32 overflow-y-auto">
                              {bill.items.map((item: OrderItem) => (
                                <div key={item.id} className="flex justify-between items-center text-sm">
                                  <span>{item.quantity}x {item.menuItem.name}</span>
                                  <div className="flex items-center space-x-2">
                                    <span>${calculateItemTotal(item).toFixed(2)}</span>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleRemoveItemFromBill(bill.id, item.id)}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground mt-1">
                              {t('pos.payment_dialog.no_items_in_bill')}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="font-medium">{t('pos.payment_dialog.total')}</span>
                          <span className="font-bold">${bill.amount.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                    
                    {unassignedItems.length > 0 && bills.length > 0 && (
                      <div className="text-sm text-yellow-600 dark:text-yellow-400">
                        {t('pos.payment_dialog.items_unassigned')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        
        <div className="-mx-6 px-6 py-4 border-t">
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('pos.payment_dialog.cancel')}
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!paymentMethod || (splitMode && unassignedItems.length > 0)}
            >
              {t('pos.payment_dialog.confirm')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}