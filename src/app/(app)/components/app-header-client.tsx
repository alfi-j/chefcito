"use client"

import Link from "next/link"
import {
  LayoutGrid,
  ClipboardList,
  Utensils,
  BarChart3,
  User,
  Languages,
  Type,

  LogOut
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/helpers"
import { useI18nStore } from "@/lib/stores/i18n-store"
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
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

import React from "react"

export function DesktopNavClient({ pathname }: { pathname: string }) {
  const { t } = useI18nStore()
  
  const menuItems = [
    { href: "/pos", label: t('pos.title'), icon: LayoutGrid },
    { href: "/kds", label: t('kds.title'), icon: ClipboardList },
    { href: "/restaurant", label: t('restaurant.title'), icon: Utensils },
    { href: "/reports", label: t('reports.title'), icon: BarChart3 },
  ]

  return (
    <>
      {menuItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Button key={item.href} variant={isActive ? "secondary" : "ghost"} size="sm" asChild>
            <Link href={item.href}>
              <item.icon className="h-4 w-4 mr-2" />
              {item.label}
            </Link>
          </Button>
        )
      })}
    </>
  )
}

export function MobileNavClient({ pathname }: { pathname: string }) {
  const { t } = useI18nStore()
  
  const menuItems = [
    { href: "/pos", label: t('pos.title'), icon: LayoutGrid },
    { href: "/kds", label: t('kds.title'), icon: ClipboardList },
    { href: "/restaurant", label: t('restaurant.title'), icon: Utensils },
    { href: "/reports", label: t('reports.title'), icon: BarChart3 },
  ]

  return (
    <div className="grid h-16 grid-cols-4 max-w-lg mx-auto justify-items-center">
      {menuItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={cn(
            "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
            isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
          )}>
            <item.icon className="h-6 w-6" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </div>
  )
}

export function CurrentPageTitleClient({ pathname }: { pathname: string }) {
  const { t } = useI18nStore()
  
  const menuItems = [
    { href: "/pos", label: t('pos.title'), icon: LayoutGrid },
    { href: "/kds", label: t('kds.title'), icon: ClipboardList },
    { href: "/restaurant", label: t('restaurant.title'), icon: Utensils },
    { href: "/reports", label: t('reports.title'), icon: BarChart3 },
    { href: "/profile", label: t('profile.title'), icon: "Settings" },
  ]

  const getPageTitle = () => {
    const currentItem = menuItems.find((item) => pathname.startsWith(item.href));
    if (currentItem) {
      return currentItem.label;
    }
    return t('app.title');
  }

  return <>{getPageTitle()}</>
}

export function UserNavClient({ 
  fontSize, 
  onFontSizeChange, 
  onLogout
}: { 
  fontSize: string;
  onFontSizeChange: (size: string) => void;
  onLogout: () => void;
}) {
  const { t, language, setLanguage } = useI18nStore()
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative w-8 h-8 rounded-full">
          <Avatar className="w-8 h-8">
            <AvatarFallback>
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {t('user.account')}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {t('user.settings')}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Languages className="mr-2 h-4 w-4" />
            <span>{t('settings.language')}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={language} onValueChange={setLanguage as (value: string) => void}>
                <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="es">Español</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Type className="mr-2 h-4 w-4" />
            <span>{t('settings.font_size')}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={fontSize} onValueChange={onFontSizeChange}>
                <DropdownMenuRadioItem value="small">{t('settings.small')}</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="medium">{t('settings.medium')}</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="large">{t('settings.large')}</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('user.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}