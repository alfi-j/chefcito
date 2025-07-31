
"use client"

import { useState } from "react";
import { type OrderItem } from "@/lib/types";
import { PaymentDialog } from "./payment-dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/context/i18n-context";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface PaymentProcessingProps {
    orderItems: OrderItem[];
    totalAmount: number;
    onPaymentSuccess: () => void;
    onCancel: () => void;
}

export function PaymentProcessing({ orderItems, totalAmount, onPaymentSuccess, onCancel }: PaymentProcessingProps) {
    const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(true);
    const { t } = useI18n();

    const subtotal = orderItems.reduce((acc, item) => {
        const extrasPrice = item.selectedExtras?.reduce((extraAcc, extra) => extraAcc + extra.price, 0) || 0;
        return acc + (item.menuItem.price + extrasPrice) * item.quantity;
    }, 0);
    const tax = subtotal * 0.08;

    return (
        <>
            <PaymentDialog
                isOpen={isPaymentDialogOpen}
                onOpenChange={(open) => {
                    if (!open) onCancel();
                    setPaymentDialogOpen(open);
                }}
                totalAmount={totalAmount}
                onConfirmPayment={onPaymentSuccess}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-120px)]">
                 <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">{t('pos.payment_dialog.title')}</CardTitle>
                        <CardDescription>{t('pos.current_order.table', { table: 4 })}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[calc(100vh-400px)]">
                            <div className="space-y-4 pr-4">
                                {orderItems.map(item => (
                                    <div key={item.id} className="flex items-center gap-4">
                                        <Image src={item.menuItem.imageUrl} alt={item.menuItem.name} width={48} height={48} className="rounded-md object-cover" data-ai-hint={item.menuItem.aiHint} />
                                        <div className="flex-grow">
                                            <p className="font-semibold">{item.quantity}x {item.menuItem.name}</p>
                                            <p className="text-sm text-muted-foreground">${item.menuItem.price.toFixed(2)}</p>
                                            {item.selectedExtras && item.selectedExtras.length > 0 && (
                                                <div className="text-sm text-muted-foreground">
                                                     {item.selectedExtras.map(extra => (
                                                        <span key={extra.id} className="ml-4 block">+ {extra.name} (${extra.price.toFixed(2)})</span>
                                                     ))}
                                                </div>
                                            )}
                                        </div>
                                        <p className="font-semibold">${((item.menuItem.price + (item.selectedExtras?.reduce((acc, e) => acc + e.price, 0) || 0)) * item.quantity).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                    <CardFooter className="flex-col !p-4 border-t">
                        <div className="w-full space-y-1 text-sm py-2">
                            <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('pos.current_order.subtotal')}</span>
                            <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('pos.current_order.tax')}</span>
                            <span>${tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-base text-primary">
                            <span>{t('pos.current_order.total')}</span>
                            <span>${totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                        <Separator className="my-2" />
                        <div className="w-full grid grid-cols-2 gap-2">
                            <Button variant="outline" onClick={onCancel}>{t('dialog.cancel')}</Button>
                            <Button onClick={() => setPaymentDialogOpen(true)}>{t('pos.current_order.payment')}</Button>
                        </div>
                    </CardFooter>
                 </Card>
            </div>
        </>
    )
}
