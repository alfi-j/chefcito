import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Create a supabase client on the browser with project's credentials
  return createBrowserClient(
    "https://eteohwcqyobdeyxyufcva.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0ZW9od2NxeW9iZGV5eXVmY3ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODI1MzcsImV4cCI6MjA2OTA1ODUzN30.vIz-fwKmuoRwFHi2d1w_XOYfxDDbDNH3T3jMGcblr5w"
  )
}
