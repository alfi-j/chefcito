
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { type Task, type Staff } from '@/lib/types';
import { useI18n } from '@/context/i18n-context';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  staffList: Staff[];
}

const priorityVariantMap = {
  'Low': 'secondary',
  'Medium': 'default',
  'High': 'destructive',
} as const;

export function TaskCard({ task, staffList }: TaskCardProps) {
    const { t } = useI18n();
    
    const assignedStaff = staffList.find(s => s.id === task.assignedTo);

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('');
    }

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="p-4 flex-row items-start justify-between">
                <div className="flex-1 space-y-1">
                    <CardTitle className="text-base font-semibold">{task.title}</CardTitle>
                    <div className="flex items-center gap-2">
<<<<<<< HEAD
                          <Badge variant={priorityVariantMap[task.priority as keyof typeof priorityVariantMap]}>
                            {t(`tasks.priorities.${task.priority}`)}
                          </Badge>

=======
                         <Badge variant={priorityVariantMap[task.priority]}>
                            {t(`waiters.tasks.priority.${task.priority.toLowerCase()}`)}
                        </Badge>
>>>>>>> d3399ff (Chefcito Beta!)
                         {task.dueDate && (
                            <span className="text-xs text-muted-foreground">{format(new Date(task.dueDate), 'MMM d')}</span>
                        )}
                    </div>
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>{t('waiters.tasks.edit')}</DropdownMenuItem>
                        <DropdownMenuItem>{t('waiters.tasks.reassign')}</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">{t('waiters.tasks.delete')}</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                {task.description && (
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                )}
            </CardContent>
            <CardFooter className="p-4 pt-0">
                {assignedStaff && (
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 text-xs">
                            <AvatarFallback>{getInitials(assignedStaff.name)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-muted-foreground">{assignedStaff.name}</span>
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}
