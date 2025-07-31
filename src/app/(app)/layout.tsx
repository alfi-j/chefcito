
"use client"
import Link from "next/link"
import {
  UtensilsCrossed,
  LayoutGrid,
  ClipboardList,
  Building,
  LogOut,
  User,
  Moon,
  Sun,
  Type,
  Languages,
} from "lucide-react"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { usePathname, useRouter } from "next/navigation"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import React, { useState } from "react"
import { cn } from "@/lib/utils"
import { I18nProvider, useI18n } from "@/context/i18n-context"


function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [fontSize, setFontSize] = useState("medium")
  const { t } = useI18n()

  const menuItems = [
    { href: "/pos", label: t('pos.title'), icon: LayoutGrid },
    { href: "/kds", label: t('kds.title'), icon: ClipboardList },
    { href: "/restaurant", label: t('restaurant.title'), icon: Building },
  ]
  
  const getPageTitle = () => {
    const currentItem = menuItems.find((item) => pathname.startsWith(item.href));
    if (currentItem) {
      return currentItem.label;
    }
    if (pathname.startsWith('/pos')) return t('pos.title');
    if (pathname.startsWith('/kds')) return t('kds.title');
    if (pathname.startsWith('/restaurant')) return t('restaurant.title');
    return "Dashboard";
  }

  const currentPage = getPageTitle();
  
  const handleLogout = async () => {
    // In a real app, this would call an API to invalidate a session
    router.push('/login')
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarRail />
        <SidebarHeader className="p-4">
          <Link href="/pos" className="flex items-center gap-2">
            <UtensilsCrossed className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-headline font-bold text-primary group-data-[collapsible=icon]:hidden">Chefcito</h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  tooltip={{children: item.label}}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} asChild tooltip={{children: t('userMenu.logout')}}>
                <div>
                  <LogOut />
                  <span>{t('userMenu.logout')}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 bg-background border-b h-16">
          <div className="flex items-center gap-2">
             <SidebarTrigger />
             <h2 className="text-xl font-headline font-semibold">
                {currentPage}
             </h2>
          </div>
          <UserNav fontSize={fontSize} onFontSizeChange={setFontSize} onLogout={handleLogout} />
        </header>
        <main className={cn("flex-1 overflow-auto p-4 md:p-6 lg:p-8 bg-muted/30", `font-size-${fontSize}`)}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}


export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </I18nProvider>
  )
}

function UserNav({ fontSize, onFontSizeChange, onLogout }: { fontSize: string, onFontSizeChange: (size: string) => void, onLogout: () => void }) {
  const { theme, setTheme } = useTheme()
  const { t, language, setLanguage } = useI18n()

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
              staff@chefcito.com
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>{t('userMenu.profile')}</span>
        </DropdownMenuItem>
        
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="ml-2">{t('userMenu.theme.title')}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                <DropdownMenuRadioItem value="light">{t('userMenu.theme.light')}</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">{t('userMenu.theme.dark')}</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">{t('userMenu.theme.system')}</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Type className="mr-2 h-4 w-4" />
            <span>{t('userMenu.font_size.title')}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={fontSize} onValueChange={onFontSizeChange}>
                <DropdownMenuRadioItem value="small">{t('userMenu.font_size.small')}</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="medium">{t('userMenu.font_size.medium')}</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="large">{t('userMenu.font_size.large')}</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Languages className="mr-2 h-4 w-4" />
            <span>{t('userMenu.language.title')}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={language} onValueChange={(value) => setLanguage(value as 'en' | 'es')}>
                <DropdownMenuRadioItem value="en">{t('userMenu.language.en')}</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="es">{t('userMenu.language.es')}</DropdownMenuRadioItem>
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
  )
}
