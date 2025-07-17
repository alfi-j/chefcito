"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

export function LoginForm() {
    const router = useRouter()
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Mock login logic
        router.push("/pos")
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="staff@chefcito.com" defaultValue="staff@chefcito.com" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" defaultValue="password" required />
            </div>
            <Button type="submit" className="w-full !mt-6 bg-primary hover:bg-accent text-primary-foreground font-bold">
                Login
            </Button>
        </form>
    )
}
