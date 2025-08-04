
"use client"
import Link from "next/link"
import {
  ChefHat,
  LayoutGrid,
  ClipboardList,
  Utensils,
  LogOut,
  User,
  Moon,
  Sun,
  Type,
  Languages,
  Settings,
  BarChart3,
  Users,
} from "lucide-react"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import React, { useState } from "react"
import { cn } from "@/lib/utils"
import { I18nProvider, useI18n } from "@/context/i18n-context"

// Simple cookie utility
const eraseCookie = (name: string) => {   
    document.cookie = name+'=; Max-Age=-99999999; path=/;';  
}


function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [fontSize, setFontSize] = useState("medium")
  const { t } = useI18n()

  const menuItems = [
    { href: "/pos", label: t('pos.title'), icon: LayoutGrid },
    { href: "/kds", label: t('kds.title'), icon: ClipboardList },
    { href: "/waiters", label: t('waiters.title'), icon: Users },
    { href: "/restaurant", label: t('restaurant.title'), icon: Utensils },
    { href: "/reports", label: t('reports.title'), icon: BarChart3 },
    { href: "/profile", label: t('profile.title'), icon: Settings, isHidden: true },
  ]
  
  const getPageTitle = () => {
    const currentItem = menuItems.find((item) => pathname.startsWith(item.href));
    if (currentItem) {
      return currentItem.label;
    }
    return "Chefcito";
  }

  const currentPage = getPageTitle();
  
  const handleLogout = async () => {
    eraseCookie("chefcito-auth");
    router.push('/login')
  }

  return (
    <div className="flex flex-col h-screen">
       <header className="sticky top-0 z-10 flex items-center justify-between p-4 bg-background/80 border-b h-16 backdrop-blur-sm">
          <div className="flex items-center gap-2">
             <Link href="/pos" className="flex items-center gap-2">
                <ChefHat className="w-8 h-8 text-primary" />
             </Link>
             <h2 className="text-xl font-headline font-semibold">
                {currentPage}
             </h2>
          </div>
          <UserNav fontSize={fontSize} onFontSizeChange={setFontSize} onLogout={handleLogout} />
        </header>

      <main className={cn("flex-1 overflow-auto p-4 sm:p-6 bg-muted/30", `font-size-${fontSize}`, "pb-24")}>
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-10 bg-background/95 border-t backdrop-blur-sm">
        <div className="grid h-16 grid-cols-5 max-w-lg mx-auto">
          {menuItems.filter(item => !item.isHidden && ["/pos", "/kds", "/waiters", "/restaurant", "/reports"].includes(item.href)).map((item) => {
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
      </nav>
    </div>
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
              staff@chefcito.com
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push('/profile')}>
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
