"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner";
import { useI18n } from "@/context/i18n-context"
import { useUser } from "@/context/user-context"

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
    const { login } = useUser();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        // Using the new login function from user context
        const success = await login(email, password);
        
        if (success) {
            // Set the auth cookie to maintain session
            setCookie("chefcito-auth", "true", 1);
            
            toast.success(t('userMenu.login_success_title'), {
                description: t('userMenu.login_success_desc'),
                duration: 3000,
            });
            router.push("/pos")
        } else {
            toast.error(t('userMenu.login_error_title'), {
                description: t('userMenu.login_error_desc'),
                duration: 3000,
            });
        }
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