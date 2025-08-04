
"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/context/i18n-context';
import { type StaffPerformance } from '@/lib/types';
import { getStaffPerformance } from '@/lib/mock-data';
import { StaffPerformanceCard } from './components/staff-performance-card';
import { DateRangePicker } from '../reports/components/date-range-picker';
import { type DateRange } from 'react-day-picker';
import { addDays } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskBoard } from './components/task-board';


function PerformanceDashboard() {
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });

  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true);
      const performanceData = await getStaffPerformance(date);
      setStaffPerformance(performanceData);
      setLoading(false);
    };
    fetchStaff();
  }, [date]);

  const renderSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <Skeleton className="h-6 w-1/2 mx-auto mb-1" />
                        <Skeleton className="h-3 w-full mx-auto" />
                    </div>
                    <div>
                        <Skeleton className="h-6 w-1/2 mx-auto mb-1" />
                        <Skeleton className="h-3 w-full mx-auto" />
                    </div>
                     <div>
                        <Skeleton className="h-6 w-1/2 mx-auto mb-1" />
                        <Skeleton className="h-3 w-full mx-auto" />
                    </div>
                </div>
            </CardContent>
        </Card>
      ))}
    </div>
  )
  
  return (
     <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div/>
            <DateRangePicker date={date} onDateChange={setDate} />
        </div>
        {loading ? (
            renderSkeleton()
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {staffPerformance.map((staff) => (
                    <StaffPerformanceCard key={staff.id} staff={staff} />
                ))}
            </div>
        )}
     </div>
  )
}


export default function WaitersPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-headline font-bold">{t('waiters.title')}</h1>
                <p className="text-muted-foreground">{t('waiters.dashboard_desc')}</p>
            </div>
        </div>

        <Tabs defaultValue="performance">
            <TabsList>
                <TabsTrigger value="performance">{t('waiters.tabs.performance')}</TabsTrigger>
                <TabsTrigger value="tasks">{t('waiters.tabs.tasks')}</TabsTrigger>
            </TabsList>
            <TabsContent value="performance" className="mt-4">
                <PerformanceDashboard />
            </TabsContent>
            <TabsContent value="tasks" className="mt-4">
                <TaskBoard />
            </TabsContent>
        </Tabs>
    </div>
  );
}
