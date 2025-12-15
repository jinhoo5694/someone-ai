import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const redirectTo = searchParams.get('redirectTo') || '/characters'

  // 배포 환경에서 올바른 origin 가져오기
  const headersList = await headers()
  const host = headersList.get('host') || headersList.get('x-forwarded-host')
  const protocol = headersList.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
  const origin = `${protocol}://${host}`

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/api/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    console.error('Google OAuth error:', error)
    return NextResponse.redirect(new URL('/?error=oauth_error', request.url))
  }

  return NextResponse.redirect(data.url)
}
