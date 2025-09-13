
import { I18nProvider } from "@/context/i18n-context"
import { LoginForm } from "./components/login-form"

export default function LoginPage() {
  return (
    <I18nProvider>
      <LoginForm />
    </I18nProvider>
  )
}
