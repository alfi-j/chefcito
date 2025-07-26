
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// This file is now used by the API routes which run in a server context.
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    "https://eteohwcqyobdeyxyufcva.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0ZW9od2NxeW9iZGV5eXVmY3ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODI1MzcsImV4cCI6MjA2OTA1ODUzN30.vIz-fwKmuoRwFHi2d1w_XOYfxDDbDNH3T3jMGcblr5w",
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
