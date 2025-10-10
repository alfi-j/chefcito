import { I18nProvider } from "@/context/i18n-context"
import { LoginForm, SignupForm } from "./components/login-form"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function LoginPage() {
  return (
    <I18nProvider>
      <LoginTabs />
    </I18nProvider>
  )
}

function LoginTabs() {
  return (
    <Tabs defaultValue="login" className="w-full max-w-sm">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>
      <TabsContent value="login">
        <LoginForm />
      </TabsContent>
      <TabsContent value="signup">
        <SignupForm />
      </TabsContent>
    </Tabs>
  )
}