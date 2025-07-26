
"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useI18n } from "@/context/i18n-context"

export function LoginForm() {
    const router = useRouter()
    const { toast } = useToast();
    const { t } = useI18n();
    const [email, setEmail] = useState("staff@chefcito.com");
    const [password, setPassword] = useState("password");
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        // Mock login - in a real app, you'd validate credentials
        toast({
            title: "Login Successful",
            description: "Welcome back!",
        });
        router.push("/pos")
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="staff@chefcito.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full !mt-6 bg-primary hover:bg-accent text-primary-foreground font-bold">
                Login
            </Button>
        </form>
    )
}
