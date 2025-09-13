
"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner";
import { useI18n } from "@/context/i18n-context"

// Simple cookie utility
const setCookie = (name: string, value: string, days: number) => {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

export function LoginForm() {
    const router = useRouter()
    const { t } = useI18n();
    const [email, setEmail] = useState("staff@chefcito.com");
    const [password, setPassword] = useState("password");
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // In a real app, this would validate credentials against a backend
        // For this mock, we just set a cookie to simulate a session
        setCookie("chefcito-auth", "true", 1);
        
        toast.success(t('userMenu.login_success_title'), {
            description: t('userMenu.login_success_desc'),
            duration: 3000,
        });
        router.push("/pos")
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">{t('userMenu.email')}</Label>
                <Input id="email" type="email" placeholder="staff@chefcito.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">{t('userMenu.password')}</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full !mt-6 bg-primary hover:bg-accent text-primary-foreground font-bold">
                {t('userMenu.login')}
            </Button>
        </form>
    )
}
