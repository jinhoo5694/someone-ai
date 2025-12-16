import { SignJWT, jwtVerify } from 'jose'
import { cookies, headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

const COOKIE_NAME = 'auth_token'

export interface JWTPayload {
  userId: string
  username: string
}

export async function createToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return {
      userId: payload.userId as string,
      username: payload.username as string,
    }
  } catch {
    return null
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

export async function getAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value || null
}

export async function removeAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  // First, try cookie-based auth (web)
  const cookieToken = await getAuthCookie()
  if (cookieToken) {
    return verifyToken(cookieToken)
  }

  // Then, try Bearer token auth (mobile)
  const headersList = await headers()
  const authHeader = headersList.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)

    // First try to verify as our custom JWT
    const customJwtPayload = await verifyToken(token)
    if (customJwtPayload) {
      return customJwtPayload
    }

    // If not our JWT, try to verify as Supabase token
    try {
      const supabase = createAdminClient()
      const { data: { user }, error } = await supabase.auth.getUser(token)

      if (!error && user) {
        return {
          userId: user.id,
          username: user.user_metadata?.name || user.email || 'User',
        }
      }
    } catch {
      // Token verification failed
    }
  }

  return null
}
