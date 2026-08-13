'use client'

import { getAuthToken } from '@/lib/client-auth'

/**
 * Wraps the global `fetch` to inject the JWT `Authorization` header on
 * same-origin `/api` requests. This ensures every store/component that calls
 * `fetch('/api/...')` sends the token without per-callsite changes.
 *
 * Public endpoints (login, google, register, invitations, payphone status)
 * are unaffected — an invalid/absent token there simply isn't used by the API.
 */
export function patchFetchWithAuth(): void {
  if (typeof window === 'undefined') return
  const originalFetch = window.fetch.bind(window)

  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let url: string
    if (typeof input === 'string') {
      url = input
    } else if (input instanceof URL) {
      url = input.toString()
    } else {
      url = input.url
    }

    const isApi = url.startsWith('/api') || url.startsWith(window.location.origin + '/api')
    const token = getAuthToken()

    if (isApi && token) {
      const headers = new Headers(init?.headers)
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`)
      }
      return originalFetch(input, { ...init, headers })
    }

    return originalFetch(input, init)
  }
}