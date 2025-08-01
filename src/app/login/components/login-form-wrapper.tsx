
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoginForm } from "./login-form"
import { Utensils } from "lucide-react"

export function LoginFormWrapper() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
            <Utensils className="h-12 w-12 text-primary" />
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline">Chefcito</CardTitle>
            <CardDescription>Welcome back! Please login to your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
