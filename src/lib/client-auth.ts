'use client'

import { JWT_COOKIE } from '@/lib/auth'

/**
 * Client-side JWT persistence.
 * The token is stored in localStorage so it can be attached to API requests.
 * (Kept in sync with the `chefcito-user` record in the user store.)
 */

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(JWT_COOKIE)
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(JWT_COOKIE, token)
}

export function clearAuthToken(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(JWT_COOKIE)
}