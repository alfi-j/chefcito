
"use client";

import React from 'react';
import { type Task, type Staff } from '@/lib/types';
import { TaskCard } from './task-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useI18n } from '@/context/i18n-context';

interface TaskColumnProps {
  status: 'To Do' | 'In Progress' | 'Done';
  tasks: Task[];
  staffList: Staff[];
}

const statusStyles = {
  'To Do': 'border-blue-500',
  'In Progress': 'border-yellow-500',
  'Done': 'border-green-500',
};

const statusKeyMap = {
    'To Do': 'to_do',
    'In Progress': 'in_progress',
    'Done': 'done',
}

export function TaskColumn({ status, tasks, staffList }: TaskColumnProps) {
    const { t } = useI18n();
    const statusKey = statusKeyMap[status];

    return (
        <div className="bg-muted/50 rounded-lg h-full">
            <div className={`p-4 border-b-4 ${statusStyles[status]}`}>
                <h3 className="text-lg font-headline font-semibold flex items-center gap-2">
                    <span>{t(`waiters.tasks.status.${statusKey}`)}</span>
                    <span className="text-sm font-normal bg-muted text-muted-foreground rounded-full px-2 py-0.5">{tasks.length}</span>
                </h3>
            </div>
             <ScrollArea className="h-[calc(100vh-400px)]">
                <div className="p-4 space-y-4">
                    {tasks.length > 0 ? (
                        tasks.map(task => (
                            <TaskCard key={task.id} task={task} staffList={staffList} />
                        ))
                    ) : (
                        <div className="text-center text-sm text-muted-foreground py-10">
                            {t('waiters.tasks.no_tasks')}
                        </div>
                    )}
                </div>
             </ScrollArea>
        </div>
    );
}
