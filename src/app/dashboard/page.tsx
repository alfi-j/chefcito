"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '@/lib/stores/user-store';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Building2,
  Plus,
  ArrowRight,
  MapPin,
  Phone,
  Store,
  Check,
} from 'lucide-react';
import { useProAccess } from '@/lib/hooks/use-pro-access';
import { ProFeatureGate } from '@/components/subscription/pro-feature-gate';

interface RestaurantData {
  id: string;
  name: string;
  ownerId: string;
  membership: 'free' | 'pro';
  phone?: string;
  address?: string;
  city?: string;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useUserStore((s) => s.getCurrentUser());
  const updateUserOptimistically = useUserStore((s) => s.updateUserOptimistically);

  const isRestaurantManager = user?.role === 'Owner' || user?.role === 'Admin';
  const { isPro } = useProAccess();
  const idsFromUser = (user?.restaurantIds as string[] | undefined) ?? [];
  const restaurantIds = idsFromUser.length
    ? idsFromUser
    : user?.restaurantId
      ? [user.restaurantId]
      : [];

  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '' });

  useEffect(() => {
    if (!user || !isRestaurantManager) return;

    const ids = restaurantIds;
    if (ids.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- loading init when there are no owned restaurants
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/restaurants?ids=${ids.join(',')}`);
        const result = await response.json();
        if (!cancelled && result.success) {
          setRestaurants(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isRestaurantManager, restaurantIds.join(',')]);

  const handleSwitch = async (restaurant: RestaurantData) => {
    if (!user?.id) return;
    setSwitchingId(restaurant.id);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          action: 'switchRestaurant',
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Switch failed');
      }
      updateUserOptimistically(user.id, { restaurantId: restaurant.id });
      toast.success(t('dashboard.switch_success', { name: restaurant.name }));
      router.push('/restaurant?tab=general');
    } catch (error) {
      console.error('Error switching restaurant:', error);
      toast.error(t('dashboard.switch_error'));
    } finally {
      setSwitchingId(null);
    }
  };

  const handleCreate = async () => {
    if (!user) return;
    if (!form.name.trim()) {
      toast.error(t('dashboard.create_name_required'));
      return;
    }
    setCreating(true);
    try {
      const response = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          ownerId: user?.id,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Create failed');
      }
      const created: RestaurantData = result.data;
      updateUserOptimistically(user.id, {
        restaurantId: created.id,
        restaurantIds: [...idsFromUser, created.id],
      });
      setRestaurants((prev) => [...prev, created]);
      setIsCreateOpen(false);
      setForm({ name: '', phone: '', address: '', city: '' });
      toast.success(t('dashboard.create_success'));
      router.push('/restaurant');
    } catch (error) {
      console.error('Error creating restaurant:', error);
      toast.error(t('dashboard.create_error'));
    } finally {
      setCreating(false);
    }
  };

  if (!user) {
    return null;
  }

  if (!isRestaurantManager) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-2">
        <Store className="h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">{t('dashboard.access_denied')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
        </div>
        {isPro || restaurants.length === 0 ? (
          <Button onClick={() => setIsCreateOpen(true)} className="sm:flex-none">
            <Plus className="mr-2 h-4 w-4" />
            {t('dashboard.add_restaurant')}
          </Button>
        ) : null}
      </div>

      {!isPro && restaurants.length > 0 && (
        <ProFeatureGate>
          <span className="hidden" />
        </ProFeatureGate>
      )}

      <div>
        <h2 className="text-lg font-headline font-semibold mb-4">
          {t('dashboard.my_restaurants')}
        </h2>

        {loading ? (
          <p className="text-muted-foreground">{t('dashboard.loading')}</p>
        ) : restaurants.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.no_restaurants')}</CardTitle>
              <CardDescription>{t('dashboard.no_restaurants_desc')}</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((restaurant) => {
              const isActive = restaurant.id === user.restaurantId;
              return (
                <Card key={restaurant.id} className="flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Building2 className="h-5 w-5 text-primary shrink-0" />
                        <CardTitle className="text-base truncate">
                          {restaurant.name}
                        </CardTitle>
                      </div>
                      <Badge variant={restaurant.membership === 'pro' ? 'default' : 'secondary'}>
                        {restaurant.membership === 'pro'
                          ? t('dashboard.membership_pro')
                          : t('dashboard.membership_free')}
                      </Badge>
                    </div>
                    {isActive && (
                      <Badge variant="default" className="w-fit">
                        <Check className="mr-1 h-3 w-3" />
                        {t('dashboard.active')}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3 flex-1">
                    <div className="space-y-1 text-sm text-muted-foreground flex-1">
                      {restaurant.city && (
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 shrink-0" />
                          {restaurant.city}
                        </p>
                      )}
                      {restaurant.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4 shrink-0" />
                          {restaurant.phone}
                        </p>
                      )}
                    </div>
                    <Button
                      variant={isActive ? 'outline' : 'default'}
                      onClick={() => handleSwitch(restaurant)}
                      disabled={switchingId === restaurant.id || isActive}
                      className="w-full"
                    >
                      {isActive ? (
                        t('dashboard.manage')
                      ) : (
                        <>
                          {t('dashboard.access')}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">
              {t('dashboard.create_restaurant')}
            </DialogTitle>
            <DialogDescription>
              {t('dashboard.create_restaurant_desc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="restaurant-name">{t('dashboard.name')}</Label>
              <Input
                id="restaurant-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={t('dashboard.name_placeholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="restaurant-phone">{t('dashboard.phone')}</Label>
              <Input
                id="restaurant-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder={t('dashboard.phone_placeholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="restaurant-address">{t('dashboard.address')}</Label>
              <Input
                id="restaurant-address"
                value={form.address}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                placeholder={t('dashboard.address_placeholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="restaurant-city">{t('dashboard.city')}</Label>
              <Input
                id="restaurant-city"
                value={form.city}
                onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                placeholder={t('dashboard.city_placeholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={creating}
            >
              {t('dashboard.cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              <Plus className="mr-2 h-4 w-4" />
              {t('dashboard.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
