import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

/**
 * Public API routes that never require a JWT.
 * Everything else under /api/* requires `Authorization: Bearer <token>`.
 */
const PUBLIC_PREFIXES = [
  // Login (identifier/password exchange) and user refresh-by-email
  '/api/users/login',
  // Google OAuth exchange + client-id config
  '/api/auth/google',
  // Public Owner signup (creates restaurant)
  '/api/auth/signup',
  // Owner signup (creates restaurant) and invitation-based staff registration
  '/api/register',
  // Invitation token validation (staff registration page, pre-auth). The
  // POST handler enforces auth + ownership + role validation itself.
  '/api/invitations',
  // Payment status polling used immediately after a PayPhone callback lands
  // on public /thank-you (before the user store has a token). PayPhone has no
  // webhooks, so confirm + status polling are the only activation path.
  '/api/payphone/confirm',
  '/api/subscriptions/status',
  // Reconciliation job (no user token; guarded by x-admin-key in handler)
  '/api/subscriptions/reconcile',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  // SSE streams (EventSource) cannot set Authorization headers,
  // so they authenticate via a `token` query parameter instead.
  const isSse = pathname === '/api/orders/events'
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : isSse
      ? request.nextUrl.searchParams.get('token')
      : null

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await verifyToken(token)
  if (!payload?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}