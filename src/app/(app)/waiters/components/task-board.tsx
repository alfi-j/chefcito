
"use client";

import React, { useState, useEffect } from 'react';
import { useI18n } from '@/context/i18n-context';
import { getTasks } from '@/lib/mock-data';
import { type Task } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export function TaskBoard() {
  const { t } = useI18n();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      const taskData = await getTasks();
      setTasks(taskData);
      setLoading(false);
    };
    fetchTasks();
  }, []);
  
  const renderSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      ))}
    </div>
  )

  if (loading) {
    return renderSkeleton();
  }

  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-headline font-semibold">{t('waiters.tasks.board_title')}</h2>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('waiters.tasks.add_task')}
            </Button>
        </div>
        <p>Task board content will go here.</p>
    </div>
  )
}
