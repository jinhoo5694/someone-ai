import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createToken, setAuthCookie } from '@/lib/auth/jwt'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirectTo') || '/characters'

  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=no_code`)
  }

  const supabase = await createClient()

  // Supabase OAuth 코드 교환
  const { data: authData, error: authError } =
    await supabase.auth.exchangeCodeForSession(code)

  if (authError || !authData.user) {
    console.error('OAuth callback error:', authError)
    return NextResponse.redirect(`${origin}/?error=auth_failed`)
  }

  const supabaseUser = authData.user
  const email = supabaseUser.email

  if (!email) {
    return NextResponse.redirect(`${origin}/?error=no_email`)
  }

  // 기존 users 테이블에서 사용자 확인
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, email, nickname')
    .eq('email', email.toLowerCase())
    .single()

  let userId: string
  let nickname: string | null = null

  if (existingUser) {
    // 기존 사용자 - 마지막 활동 시간 업데이트
    userId = existingUser.id
    nickname = existingUser.nickname

    await supabase
      .from('users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', userId)
  } else {
    // 새 사용자 생성 (구글 로그인은 이메일 인증 완료 상태로)
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: '', // OAuth 사용자는 비밀번호 없음
        email_verified: true, // 구글에서 이미 인증됨
        nickname: supabaseUser.user_metadata?.full_name || null,
      })
      .select('id, nickname')
      .single()

    if (createError || !newUser) {
      console.error('User creation error:', createError)
      return NextResponse.redirect(`${origin}/?error=user_creation_failed`)
    }

    userId = newUser.id
    nickname = newUser.nickname
  }

  // JWT 토큰 생성 및 쿠키 설정
  const token = await createToken({
    userId,
    username: email,
  })
  await setAuthCookie(token)

  return NextResponse.redirect(`${origin}${redirectTo}`)
}
