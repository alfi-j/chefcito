
"use client"

import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/context/i18n-context';
import { type Staff } from '@/lib/types';
import { getStaff } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';

export default function WaitersPage() {
  const { t } = useI18n();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true);
      const staffList = await getStaff();
      setStaff(staffList);
      setLoading(false);
    };
    fetchStaff();
  }, []);

  const getStatusVariant = (status: Staff['status']) => {
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

  if (loading) {
    return <div>{t('waiters.loading')}</div>
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">{t('waiters.roster_title')}</CardTitle>
          <CardDescription>{t('waiters.roster_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('waiters.table.name')}</TableHead>
                  <TableHead>{t('waiters.table.role')}</TableHead>
                  <TableHead>{t('waiters.table.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.role}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(member.status)}>
                        {t(`waiters.status.${member.status.toLowerCase().replace(' ', '_')}`)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
