"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner";
import { useI18nStore } from "@/lib/stores/i18n-store"
import { useNormalizedUserStore } from "@/lib/stores/user-store-normalized";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
    const { t } = useI18nStore();
    const { login } = useNormalizedUserStore();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        // Using the new login function from user store
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

export function SignupForm() {
    const router = useRouter()
    const { t } = useI18nStore();
    const [activeTab, setActiveTab] = useState<"owner" | "staff">("owner");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            toast.error(t('userMenu.signup_error_title'), {
                description: t('userMenu.passwords_do_not_match'),
                duration: 3000,
            });
            return;
        }
        
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    role: activeTab === "owner" ? "Owner" : "Staff",
                    status: "Off Shift",
                    membership: "free"
                }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                toast.success(t('userMenu.signup_success_title'), {
                    description: t('userMenu.signup_success_desc'),
                    duration: 3000,
                });
                router.push("/login");
            } else {
                toast.error(t('userMenu.signup_error_title'), {
                    description: data.error || t('userMenu.signup_error_desc'),
                    duration: 3000,
                });
            }
        } catch (error) {
            toast.error(t('userMenu.signup_error_title'), {
                description: t('userMenu.signup_error_desc'),
                duration: 3000,
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "owner" | "staff")}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="owner">{t('userMenu.register_as_owner')}</TabsTrigger>
                    <TabsTrigger value="staff">{t('userMenu.register_as_staff')}</TabsTrigger>
                </TabsList>
            </Tabs>
            
            <div className="space-y-2">
                <Label htmlFor="signup-name">{t('userMenu.name')}</Label>
                <Input 
                    id="signup-name" 
                    type="text" 
                    placeholder={t('userMenu.enter_your_name')} 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="signup-email">{t('userMenu.email')}</Label>
                <Input 
                    id="signup-email" 
                    type="email" 
                    placeholder="staff@chefcito.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="signup-password">{t('userMenu.password')}</Label>
                <Input 
                    id="signup-password" 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="signup-confirm-password">{t('userMenu.confirm_password')}</Label>
                <Input 
                    id="signup-confirm-password" 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    required 
                />
            </div>
            
            <Button type="submit" className="w-full !mt-6 bg-primary hover:bg-accent text-primary-foreground font-bold">
                {t('userMenu.sign_up')}
            </Button>
        </form>
    )
}