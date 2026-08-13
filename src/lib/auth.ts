import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

export const JWT_COOKIE = 'chefcito-token'

const SECRET_FALLBACK = 'chefcito_secret_key'

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || SECRET_FALLBACK
  return new TextEncoder().encode(secret)
}

export interface AuthPayload extends JWTPayload {
  userId?: string
  email?: string
}

export async function signToken(payload: AuthPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecretKey())
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ['HS256'] })
    return payload as AuthPayload
  } catch {
    return null
  }
}

export function extractToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim() || null
  }
  const url = new URL(request.url)
  return url.searchParams.get('token')
}