
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useI18n } from '@/context/i18n-context';
import { getTasks, getStaff } from '@/lib/mock-data';
import { type Task, type Staff } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { TaskColumn } from './task-column';

type TaskStatus = 'To Do' | 'In Progress' | 'Done';

export function TaskBoard() {
  const { t } = useI18n();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [taskData, staffData] = await Promise.all([getTasks(), getStaff()]);
        setTasks(taskData);
        setStaff(staffData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const groupedTasks = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      'To Do': [],
      'In Progress': [],
      'Done': [],
    };
    tasks.forEach(task => {
      if (groups[task.status]) {
        groups[task.status].push(task);
      }
    });
    return groups;
  }, [tasks]);

  const taskColumns: TaskStatus[] = ['To Do', 'In Progress', 'Done'];
  
  const renderSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-4 p-4 rounded-lg bg-muted/50">
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-headline font-semibold">{t('waiters.tasks.board_title')}</h2>
              <p className="text-muted-foreground text-sm">{t('waiters.tasks.board_desc')}</p>
            </div>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('waiters.tasks.add_task')}
            </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {taskColumns.map(status => (
                <TaskColumn 
                    key={status}
                    status={status}
                    tasks={groupedTasks[status]}
                    staffList={staff}
                />
            ))}
        </div>
    </div>
  )
}
