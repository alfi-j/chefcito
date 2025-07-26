
import { I18nProvider } from "@/context/i18n-context"
import { LoginFormWrapper } from "./components/login-form-wrapper"

export default function LoginPage() {
  return (
    <I18nProvider>
      <LoginFormWrapper />
    </I18nProvider>
  )
}
