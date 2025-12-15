import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

const COOKIE_NAME = 'auth_token'

async function verifyAuth(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return false

  try {
    await jwtVerify(token, JWT_SECRET)
    return true
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 보호된 경로 체크
  const protectedPaths = ['/friends', '/chats', '/settings']
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  )

  // 인증이 필요한 API 체크
  const protectedApiPaths = ['/api/chat', '/api/conversations', '/api/premium-interest']
  const isProtectedApi = protectedApiPaths.some((path) =>
    pathname.startsWith(path)
  )

  const isAuthenticated = await verifyAuth(request)

  // 보호된 페이지 접근 시
  if (isProtectedPath && !isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 보호된 API 접근 시
  if (isProtectedApi && !isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 로그인된 사용자가 로그인/회원가입 페이지 접근 시
  if ((pathname === '/' || pathname === '/signup') && isAuthenticated) {
    return NextResponse.redirect(new URL('/friends', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth|api/characters|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
