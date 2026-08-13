"use client";
import Link from "next/link";
import {
  ChefHat,
  LayoutGrid,
  ClipboardList,
  Utensils,
  LogOut,
  User,
  Languages,
  Settings,
  BarChart3,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/ui/avatar";
import React, { useEffect } from "react";
import { cn } from "@/lib/helpers";
import { useTranslation } from 'react-i18next';
import { changeLanguage, type SupportedLanguage } from '@/lib/i18n';
import { useAuth } from "@/components/layout/auth-provider";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { useRolesStore } from "@/lib/stores/roles-store";
import { useProAccess } from "@/lib/hooks/use-pro-access";

// Permission required to see each nav route (Owner/Admin always see everything)
const NAV_PERMISSIONS: Record<string, string> = {
  '/pos': 'order_management',
  '/kds': 'kds_access',
  '/reports': 'reports_access',
};

export function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { logout } = useAuth();
  const { can, user } = usePermissions();
  const { isPro } = useProAccess();
  const fetchRoles = useRolesStore((s) => s.fetchRoles);
  const fetchedRestaurantId = useRolesStore((s) => s.fetchedRestaurantId);

  // Ensure custom roles are loaded so permission checks work for custom roles
  useEffect(() => {
    if (user?.restaurantId && fetchedRestaurantId !== user.restaurantId) {
      fetchRoles(user.restaurantId);
    }
  }, [fetchedRestaurantId, fetchRoles, user?.restaurantId]);

  const allMenuItems = [
    { href: "/dashboard", label: t('dashboard.title'), icon: Store, ownerOnly: true },
    { href: "/pos", label: t('pos.title'), icon: LayoutGrid },
    { href: "/kds", label: t('kds.title'), icon: ClipboardList },
    { href: "/reports", label: t('reports.title'), icon: BarChart3 },
    { href: "/profile", label: t('profile.title'), icon: Settings, isHidden: true },
  ];

  // Filter nav items the current user is allowed to see
  const menuItems = allMenuItems.filter((item) => {
    if (item.isHidden) return true; // always keep hidden items (profile)
    if (item.ownerOnly) {
      return user?.role === 'Owner' || user?.role === 'Admin';
    }
    if (item.href === '/reports' && !isPro) {
      return false; // Reports is a Pro-only feature
    }
    const requiredPermission = NAV_PERMISSIONS[item.href];
    if (!requiredPermission) return true;
    return can(requiredPermission);
  });

  const getPageTitle = () => {
    const currentItem = menuItems.find((item) => pathname.startsWith(item.href));
    if (currentItem) {
      return currentItem.label;
    }
    return t('app.title');
  };

  const currentPage = getPageTitle();

  const handleLogout = async () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-10 flex items-center justify-between p-4 bg-background/80 border-b h-16 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link href="/pos" className="flex items-center gap-2">
            <ChefHat className="w-8 h-8 text-primary" />
            <span className="text-xl font-headline font-semibold hidden sm:inline-block">{t('app.title')}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {menuItems.filter(item => !item.isHidden).map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Button key={item.href} variant={isActive ? "secondary" : "ghost"} size="sm" asChild>
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-headline font-semibold md:hidden">
              {currentPage}
            </h2>
            <UserNav
              onLogout={handleLogout}
              showRestaurant={user?.role === 'Owner' || user?.role === 'Admin'}
            />
          </div>
        </div>
      </header>

      <main className={cn("flex-1 overflow-auto p-4 sm:p-6 bg-muted/30", "pb-24 md:pb-6")}>
        {children}
      </main>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 bg-background/95 border-t backdrop-blur-sm md:hidden">
        <div className="flex h-16 max-w-lg mx-auto justify-around items-center">
          {menuItems.filter(item => !item.isHidden).map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
              )}>
                <item.icon className="h-6 w-6" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function UserNav({ onLogout, showRestaurant }: { onLogout: () => void, showRestaurant: boolean }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-2 border-primary/50 flex items-center justify-center">
            <User className="h-5 w-5" />
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{t('userMenu.staff_member')}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {t('userMenu.email')}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>{t('userMenu.profile')}</span>
        </DropdownMenuItem>

        {showRestaurant && (
          <DropdownMenuItem onSelect={() => router.push('/restaurant?tab=general')}>
            <Utensils className="mr-2 h-4 w-4" />
            <span>{t('userMenu.restaurant')}</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Languages className="mr-2 h-4 w-4" />
            <span>{t('userMenu.language.title')}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={i18n.language}
                onValueChange={(value: string) => changeLanguage(value as SupportedLanguage)}
              >
                <DropdownMenuRadioItem value="en">{t('userMenu.language.en')}</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="es">{t('userMenu.language.es')}</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="fr">{t('userMenu.language.fr')}</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('userMenu.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}