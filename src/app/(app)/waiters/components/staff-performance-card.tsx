
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { type StaffPerformance } from '@/lib/types';
import { useI18n } from '@/context/i18n-context';
import { User } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface StaffPerformanceCardProps {
    staff: StaffPerformance;
}

export function StaffPerformanceCard({ staff }: StaffPerformanceCardProps) {
    const { t } = useI18n();

    const getStatusVariant = (status: StaffPerformance['status']) => {
        switch (status) {
        case 'On Shift':
            return 'default';
        case 'Off Shift':
            return 'secondary';
        case 'On Break':
            return 'outline';
        default:
            return 'secondary';
        }
    }

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('');
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 text-lg">
                        <AvatarFallback>{getInitials(staff.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <CardTitle className="text-xl font-headline">{staff.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                           <span>{staff.role}</span>
                           <Badge variant={getStatusVariant(staff.status)} className="capitalize">
                             {t(`waiters.status.${staff.status.toLowerCase().replace(' ', '_')}`)}
                           </Badge>
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Separator className="mb-4" />
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-2xl font-bold">{staff.tablesServed}</p>
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{t('waiters.kpi.tables_served')}</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold">${staff.totalSales.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{t('waiters.kpi.total_sales')}</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold">${staff.avgSaleValue.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{t('waiters.kpi.avg_sale')}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
